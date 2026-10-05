const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const headers = () => ({
  Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
  accept: "application/json",
});

const request = async (path, params = {}) => {
  const url = new URL(`${TMDB_BASE_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const controller = new AbortController();
  const timeoutMs = Math.max(
    5000,
    Number(process.env.SCENE_FINDER_TMDB_TIMEOUT_MS || 15000)
  );
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: headers(),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`TMDB ${response.status}: ${await response.text()}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
};

const normalize = (value = "") =>
  String(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const unique = (items) => [...new Set(items.filter(Boolean))];

const cleanSignal = (value = "") =>
  String(value)
    .replace(/[@#][\p{L}\p{N}_-]+/gu, " ")
    .replace(/\b(?:fyp|viral|explore|reels?|instagram|follow|subscribe|like|share|comment|tag)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const isUsefulQuery = (value = "") => {
  const text = cleanSignal(value);
  const words = text.split(/\s+/).filter(Boolean);
  if (text.length < 3 || text.length > 120 || words.length > 18) return false;
  if (/^[\d\s._-]+$/.test(text)) return false;
  const letters = (text.match(/\p{L}/gu) || []).length;
  return letters >= 3;
};

const toCandidate = (item) => {
  const contentType =
    item.contentType ||
    (item.media_type === "tv" || item.media_type === "movie"
      ? item.media_type
      : null);

  if (!contentType || !item.id) return null;

  return {
    contentId: Number(item.id),
    contentType,
    title:
      contentType === "tv"
        ? item.name || item.original_name || ""
        : item.title || item.original_title || "",
    originalTitle:
      contentType === "tv"
        ? item.original_name || item.name || ""
        : item.original_title || item.title || "",
    overview: item.overview || "",
    releaseDate:
      contentType === "tv"
        ? item.first_air_date || ""
        : item.release_date || "",
    rating: Number(item.vote_average || 0),
    popularity: Number(item.popularity || 0),
    voteCount: Number(item.vote_count || 0),
    image: item.poster_path
      ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
      : "",
    backdropImage: item.backdrop_path
      ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}`
      : "",
  };
};

const dedupe = (items) => {
  const map = new Map();
  for (const item of items) {
    if (!item?.contentId || !item?.contentType || !item.title) continue;
    const key = `${item.contentType}:${item.contentId}`;
    if (!map.has(key)) map.set(key, item);
  }
  return [...map.values()];
};

const searchMulti = async (query, language = "en-US") => {
  const data = await request("/search/multi", {
    query,
    language,
    include_adult: false,
    page: 1,
  });

  return (data.results || [])
    .filter((item) => item.media_type === "movie" || item.media_type === "tv")
    .map(toCandidate)
    .filter(Boolean);
};

const searchTyped = async (query, type, language = "en-US") => {
  const endpoint = type === "tv" ? "/search/tv" : "/search/movie";
  const data = await request(endpoint, {
    query,
    language: "en-US",
    include_adult: false,
    page: 1,
  });

  return (data.results || [])
    .map((item) => toCandidate({ ...item, contentType: type }))
    .filter(Boolean);
};

const extractQueries = ({ caption = "", ocr = "", speech = "" }) => {
  const sourceLines = [
    ...String(caption).split(/[\n|]+/),
    ...String(ocr).split(/[\n|]+/),
    ...String(speech).split(/[.!?\n]+/),
  ];

  const candidates = sourceLines
    .map(cleanSignal)
    .filter(isUsefulQuery);

  const querySet = new Set(candidates.slice(0, 12));

  for (const line of candidates.slice(0, 8)) {
    const words = line.split(/\s+/);
    if (words.length >= 2) {
      querySet.add(words.slice(0, 4).join(" "));
      querySet.add(words.slice(-4).join(" "));
    }
  }

  return unique([...querySet]).slice(0, 16);
};

const discoverSlices = async () => {
  const slices = [
    ["movie", { sort_by: "popularity.desc", region: "IN" }],
    ["movie", { sort_by: "vote_count.desc", region: "IN", vote_count_gte: 50 }],
    ["movie", { sort_by: "vote_average.desc", region: "IN", vote_count_gte: 250 }],
    ["movie", { sort_by: "popularity.desc", with_original_language: "hi", region: "IN" }],
    ["tv", { sort_by: "popularity.desc", region: "IN" }],
    ["tv", { sort_by: "vote_count.desc", region: "IN", vote_count_gte: 50 }],
    ["tv", { sort_by: "vote_average.desc", region: "IN", vote_count_gte: 100 }],
    ["tv", { sort_by: "popularity.desc", with_original_language: "hi", region: "IN" }],
  ];

  const output = [];
  const pages = Math.max(
    1,
    Math.min(3, Number(process.env.SCENE_FINDER_DISCOVERY_PAGES || 2))
  );

  const tasks = [];
  for (const [type, baseParams] of slices) {
    for (let page = 1; page <= pages; page += 1) {
      tasks.push({ type, baseParams, page });
    }
  }

  const concurrency = Math.max(
    2,
    Math.min(6, Number(process.env.SCENE_FINDER_DISCOVERY_CONCURRENCY || 4))
  );

  for (let index = 0; index < tasks.length; index += concurrency) {
    const batch = tasks.slice(index, index + concurrency);
    const results = await Promise.all(
      batch.map(async ({ type, baseParams, page }) => {
        try {
          const data = await request(`/discover/${type}`, {
            ...baseParams,
            language: "en-US",
            include_adult: false,
            include_video: false,
            page,
          });
          return (data.results || [])
            .map((item) => toCandidate({ ...item, contentType: type }))
            .filter(Boolean);
        } catch (error) {
          console.error(`Scene discovery ${type} slice failed:`, error.message);
          return [];
        }
      })
    );
    output.push(...results.flat());
  }

  return output;
};

const rankCandidate = (candidate, queries) => {
  const title = normalize(candidate.title);
  const original = normalize(candidate.originalTitle);
  let score = 0;

  for (const query of queries) {
    const q = normalize(query);
    if (!q) continue;

    if (q === title || q === original) score = Math.max(score, 1);
    else if (title.includes(q) || original.includes(q)) score = Math.max(score, 0.92);
    else {
      const qTokens = new Set(q.split(" ").filter((x) => x.length > 1));
      const titleTokens = new Set(`${title} ${original}`.split(" "));
      const overlap = [...qTokens].filter((x) => titleTokens.has(x)).length;
      if (qTokens.size) score = Math.max(score, overlap / qTokens.size * 0.82);
    }
  }

  return score * 0.75 +
    Math.min(1, candidate.popularity / 100) * 0.12 +
    Math.min(1, candidate.voteCount / 5000) * 0.08 +
    Math.min(1, candidate.rating / 10) * 0.05;
};

const discoverSceneCandidates = async ({
  caption = "",
  ocrText = "",
  speechText = "",
}) => {
  const queries = extractQueries({
    caption,
    ocr: ocrText,
    speech: speechText,
  });

  const searched = [];
  const searchConcurrency = Math.max(
    1,
    Math.min(4, Number(process.env.SCENE_FINDER_SEARCH_CONCURRENCY || 3))
  );

  for (let index = 0; index < queries.length; index += searchConcurrency) {
    const batch = queries.slice(index, index + searchConcurrency);
    const results = await Promise.all(
      batch.map(async (query) => {
        try {
          const [multiEn, moviesEn, tvEn, multiHi, moviesHi, tvHi] = await Promise.all([
            searchMulti(query, "en-US"),
            searchTyped(query, "movie", "en-US"),
            searchTyped(query, "tv", "en-US"),
            searchMulti(query, "hi-IN"),
            searchTyped(query, "movie", "hi-IN"),
            searchTyped(query, "tv", "hi-IN"),
          ]);
          return [\n            ...multiEn,\n            ...moviesEn,\n            ...tvEn,\n            ...multiHi,\n            ...moviesHi,\n            ...tvHi,\n          ];
        } catch (error) {
          console.error(`Scene search failed for "${query}":`, error.message);
          return [];
        }
      })
    );
    searched.push(...results.flat());
  }

  const rankedSearch = dedupe(searched)
    .map((candidate) => ({
      candidate,
      retrievalScore: rankCandidate(candidate, queries),
    }))
    .sort((a, b) => b.retrievalScore - a.retrievalScore);

  const searchLimit = Math.max(
    30,
    Number(process.env.SCENE_FINDER_SEARCH_CANDIDATES || 80)
  );

  let candidates = rankedSearch
    .slice(0, searchLimit)
    .map((item) => item.candidate);

  const bestRetrieval = rankedSearch[0]?.retrievalScore || 0;
  const needsBroadDiscovery =
    candidates.length < 40 ||
    bestRetrieval < 0.58 ||
    queries.length === 0;

  if (needsBroadDiscovery) {
    const broad = await discoverSlices();
    candidates = dedupe([
      ...candidates,
      ...broad,
    ]);
  }

  const maxCandidates = Math.max(
    80,
    Number(process.env.SCENE_FINDER_MAX_CANDIDATES || 220)
  );

  candidates = candidates
    .map((candidate) => ({
      candidate,
      retrievalScore: rankCandidate(candidate, queries),
    }))
    .sort((a, b) => {
      if (b.retrievalScore !== a.retrievalScore) {
        return b.retrievalScore - a.retrievalScore;
      }
      return (
        (b.candidate.popularity || 0) -
        (a.candidate.popularity || 0)
      );
    })
    .slice(0, maxCandidates)
    .map((item) => item.candidate);

  console.log("Scene Finder V3 discovery:", {
    queries,
    candidateCount: candidates.length,
  });

  return {
    queries,
    candidates,
  };
};

module.exports = {
  discoverSceneCandidates,
};