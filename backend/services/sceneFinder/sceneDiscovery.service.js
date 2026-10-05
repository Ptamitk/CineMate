const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const headers = () => ({
  Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
  accept: "application/json",
});

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const request = async (path, params = {}, attempt = 0) => {
  const url = new URL(`${TMDB_BASE_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  });

  const controller = new AbortController();
  const timeoutMs = Math.max(5000, Number(process.env.SCENE_FINDER_TMDB_TIMEOUT_MS || 10000));
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { headers: headers(), signal: controller.signal });
    if (!response.ok) {
      const body = await response.text();
      const error = new Error(`TMDB ${response.status}: ${body.slice(0, 300)}`);
      error.status = response.status;
      throw error;
    }
    return response.json();
  } catch (error) {
    const retryable = error.name === "AbortError" || error.status === 429 || (error.status >= 500 && error.status < 600);
    if (retryable && attempt < 1) {
      await sleep(250 * 2 ** attempt);
      return request(path, params, attempt + 1);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

const normalize = (value = "") =>
  String(value).normalize("NFKC").toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();

const unique = items => [...new Set(items.filter(Boolean))];

const cleanSignal = (value = "") =>
  String(value).normalize("NFKC")
    .replace(/[@#][\p{L}\p{N}_-]+/gu, " ")
    .replace(/\b(?:fyp|viral|explore|reels?|instagram|follow|subscribe|like|share|comment|tag|now playing|only in theaters?|coming soon|opening night|audience reaction|exclusive look|official trailer|watch now|buy tickets?|tickets?|relive the experience)\b/gi, " ")
    .replace(/\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b/g, " ")
    .replace(/\s+/g, " ").trim();

const isUsefulQuery = value => {
  const text = cleanSignal(value);
  const words = text.split(/\s+/).filter(Boolean);
  if (text.length < 3 || text.length > 100 || words.length > 14) return false;
  if (/^[\d\s._-]+$/.test(text)) return false;
  const letters = (text.match(/\p{L}/gu) || []).length;
  if (letters < 3) return false;
  const uniqueLetters = new Set(text.toLowerCase().replace(/[^\p{L}]/gu, "")).size;
  return uniqueLetters >= 3;
};

const toCandidate = item => {
  const contentType = item.contentType || (item.media_type === "tv" || item.media_type === "movie" ? item.media_type : null);
  if (!contentType || !item.id) return null;
  return {
    contentId: Number(item.id), contentType,
    title: contentType === "tv" ? item.name || item.original_name || "" : item.title || item.original_title || "",
    originalTitle: contentType === "tv" ? item.original_name || item.name || "" : item.original_title || item.title || "",
    overview: item.overview || "",
    releaseDate: contentType === "tv" ? item.first_air_date || "" : item.release_date || "",
    rating: Number(item.vote_average || 0), popularity: Number(item.popularity || 0), voteCount: Number(item.vote_count || 0),
    image: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "",
    backdropImage: item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : "",
  };
};

const dedupe = items => {
  const map = new Map();
  for (const item of items) {
    if (!item?.contentId || !item?.contentType || !item.title) continue;
    const key = `${item.contentType}:${item.contentId}`;
    if (!map.has(key)) map.set(key, item);
  }
  return [...map.values()];
};

const searchMulti = async (query, language = "en-US") => {
  const data = await request("/search/multi", { query, language, include_adult: false, page: 1 });
  return (data.results || []).filter(item => item.media_type === "tv" || item.media_type === "movie").map(toCandidate).filter(Boolean);
};

const searchTyped = async (query, type, language = "en-US") => {
  const endpoint = type === "tv" ? "/search/tv" : "/search/movie";
  const data = await request(endpoint, { query, language, include_adult: false, page: 1 });
  return (data.results || []).map(item => toCandidate({ ...item, contentType: type })).filter(Boolean);
};

const extractQueries = ({ caption = "", ocr = "", speech = "" }) => {
  // Speech is scene dialogue, not a reliable title signal. Use it for
  // candidate discovery only when visual/text metadata is absent; otherwise
  // dialogue can turn phrases such as "what's wrong with you" into fake titles.
  const sources = [
    ...String(caption).split(/[\n|]+/),
    ...String(ocr).split(/[\n|]+/),
    ...(!cleanSignal(caption) && !cleanSignal(ocr)
      ? String(speech).split(/[.!?\n]+/)
      : []),
  ];

  const candidates = sources
    .map(cleanSignal)
    .filter(isUsefulQuery)
    .sort((a, b) => {
      const aTitleLike = /\b(?:movie|film|series|season|episode|part|chapter)\b/i.test(a) ? 1 : 0;
      const bTitleLike = /\b(?:movie|film|series|season|episode|part|chapter)\b/i.test(b) ? 1 : 0;
      return bTitleLike - aTitleLike || b.length - a.length;
    });

  const querySet = new Set();
  for (const line of candidates.slice(0, 6)) {
    const words = line.split(/\s+/);
    querySet.add(line);
    if (words.length >= 2 && words.length <= 8) {
      querySet.add(words.slice(0, Math.min(5, words.length)).join(" "));
      querySet.add(words.slice(-Math.min(5, words.length)).join(" "));
    }
  }

  return unique([...querySet]).slice(0, 10);
};

let broadDiscoveryCache = null;
let broadDiscoveryExpiresAt = 0;

const discoverSlices = async () => {
  if (broadDiscoveryCache && Date.now() < broadDiscoveryExpiresAt) {
    return broadDiscoveryCache;
  }

  const slices = [
    ["movie", { sort_by: "popularity.desc", region: "IN" }],
    ["movie", { sort_by: "vote_count.desc", region: "IN", vote_count_gte: 50 }],
    ["movie", { sort_by: "vote_average.desc", region: "IN", vote_count_gte: 20 }],
    ["movie", { sort_by: "primary_release_date.desc", region: "IN" }],
    ["movie", { sort_by: "popularity.desc", with_original_language: "hi", region: "IN" }],
    ["movie", { sort_by: "popularity.desc", with_original_language: "ta", region: "IN" }],
    ["movie", { sort_by: "popularity.desc", with_original_language: "te", region: "IN" }],
    ["tv", { sort_by: "popularity.desc", region: "IN" }],
    ["tv", { sort_by: "vote_count.desc", region: "IN", vote_count_gte: 50 }],
    ["tv", { sort_by: "vote_average.desc", region: "IN", vote_count_gte: 20 }],
    ["tv", { sort_by: "first_air_date.desc", region: "IN" }],
    ["tv", { sort_by: "popularity.desc", with_original_language: "hi", region: "IN" }],
    ["tv", { sort_by: "popularity.desc", with_original_language: "ko", region: "IN" }],
  ];

  const pages = Math.max(1, Math.min(3, Number(process.env.SCENE_FINDER_DISCOVERY_PAGES || 2)));
  const tasks = slices.flatMap(([type, baseParams]) =>
    Array.from({ length: pages }, (_, i) => ({ type, baseParams, page: i + 1 }))
  );

  const concurrency = Math.max(3, Math.min(6, Number(process.env.SCENE_FINDER_DISCOVERY_CONCURRENCY || 6)));
  const output = [];

  for (let i = 0; i < tasks.length; i += concurrency) {
    const results = await Promise.all(tasks.slice(i, i + concurrency).map(async ({ type, baseParams, page }) => {
      try {
        const data = await request(`/discover/${type}`, {
          ...baseParams, language: "en-US", include_adult: false, include_video: false, page
        });
        return (data.results || []).map(item => toCandidate({ ...item, contentType: type })).filter(Boolean);
      } catch (error) {
        console.error(`Scene discovery ${type} slice failed:`, error.message);
        return [];
      }
    }));
    output.push(...results.flat());
  }

  broadDiscoveryCache = dedupe(output);
  broadDiscoveryExpiresAt = Date.now() + Math.max(60, Number(process.env.SCENE_FINDER_DISCOVERY_CACHE_SECONDS || 900)) * 1000;
  return broadDiscoveryCache;
};

const tokenSimilarity = (a, b) => {
  const aa = new Set(normalize(a).split(" ").filter(x => x.length > 1));
  const bb = new Set(normalize(b).split(" ").filter(x => x.length > 1));
  if (!aa.size || !bb.size) return 0;
  return [...aa].filter(x => bb.has(x)).length / Math.max(aa.size, bb.size);
};

const rankCandidate = (candidate, queries) => {
  let titleScore = 0;
  let overviewScore = 0;

  for (const query of queries) {
    const q = normalize(query);
    const queryWords = q.split(" ").filter(word => word.length >= 2);
    if (!q || queryWords.length === 0) continue;

    for (const name of [candidate.title, candidate.originalTitle]) {
      const n = normalize(name);
      const nameWords = n.split(" ").filter(word => word.length >= 2);

      if (q === n) {
        titleScore = Math.max(titleScore, 1);
        continue;
      }

      // Long conversational phrases should not become near-exact titles just
      // because a short title is contained inside them.
      const containment = n.includes(q) || q.includes(n);
      const lengthRatio = Math.min(queryWords.length, nameWords.length) /
        Math.max(queryWords.length, nameWords.length);

      if (containment && lengthRatio >= 0.5) {
        titleScore = Math.max(titleScore, 0.94);
      } else {
        const similarity = tokenSimilarity(q, n);
        // Require meaningful token coverage for multi-word queries.
        titleScore = Math.max(
          titleScore,
          similarity * (queryWords.length >= 3 ? 0.78 : 0.88)
        );
      }
    }

    overviewScore = Math.max(overviewScore, tokenSimilarity(q, candidate.overview) * 0.45);
  }

  return titleScore * 0.82 +
    overviewScore * 0.05 +
    Math.min(1, candidate.popularity / 100) * 0.06 +
    Math.min(1, candidate.voteCount / 5000) * 0.04 +
    Math.min(1, candidate.rating / 10) * 0.03;
};

const discoverSceneCandidates = async ({ caption = "", ocrText = "", speechText = "" }) => {
  const queries = extractQueries({ caption, ocr: ocrText, speech: speechText });
  const searched = [];
  const searchConcurrency = Math.max(2, Math.min(6, Number(process.env.SCENE_FINDER_SEARCH_CONCURRENCY || 6)));

  for (let index = 0; index < queries.length; index += searchConcurrency) {
    const results = await Promise.all(queries.slice(index, index + searchConcurrency).map(async query => {
      try {
        const [multiEn, multiHi] = await Promise.all([
          searchMulti(query, "en-US"),
          searchMulti(query, "hi-IN"),
        ]);

        const merged = [...multiEn, ...multiHi];

        // Typed searches are only used when multi-search returns too little.
        if (merged.length < 3) {
          const typed = await Promise.all([
            searchTyped(query, "movie", "en-US"),
            searchTyped(query, "tv", "en-US"),
          ]);
          merged.push(...typed.flat());
        }

        return merged;
      } catch (error) {
        console.error(`Scene search failed for "${query}":`, error.message);
        return [];
      }
    }));

    searched.push(...results.flat());
  }

  const rankedSearch = dedupe(searched)
    .map(candidate => ({ candidate, retrievalScore: rankCandidate(candidate, queries) }))
    .sort((a, b) => b.retrievalScore - a.retrievalScore);

  const searchLimit = Math.max(24, Number(process.env.SCENE_FINDER_SEARCH_CANDIDATES || 64));
  let candidates = rankedSearch.slice(0, searchLimit).map(item => item.candidate);
  const bestRetrieval = rankedSearch[0]?.retrievalScore || 0;

  if (candidates.length < 32 || bestRetrieval < 0.58 || queries.length === 0) {
    const broad = await discoverSlices();
    candidates = dedupe([...candidates, ...broad]);
  }

  const maxCandidates = Math.max(120, Number(process.env.SCENE_FINDER_MAX_CANDIDATES || 260));
  candidates = candidates
    .map(candidate => ({ candidate, retrievalScore: rankCandidate(candidate, queries) }))
    .sort((a, b) => b.retrievalScore - a.retrievalScore || (b.candidate.popularity || 0) - (a.candidate.popularity || 0))
    .slice(0, maxCandidates)
    .map(item => item.candidate);

  console.log("Scene Finder V4 discovery:", {
    queries,
    candidateCount: candidates.length,
    bestRetrieval: Number(bestRetrieval.toFixed(4))
  });

  return { queries, candidates };
};

module.exports = { discoverSceneCandidates };
