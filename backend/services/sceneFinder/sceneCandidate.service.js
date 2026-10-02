const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const getHeaders = () => ({
  Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
  "Content-Type": "application/json",
});

const normalizeText = (value = "") =>
  String(value)
    .normalize("NFKC")
    .replace(/[“”"']/g, "")
    .replace(/[^\p{L}\p{N}\s:./-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeTitle = (value = "") =>
  normalizeText(value)
    .replace(/[:\-–—|/\\()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const unique = (items) => [
  ...new Set(items.filter(Boolean)),
];

const extractYear = (text = "") => {
  const match = String(text).match(
    /\b(19\d{2}|20\d{2})\b/
  );

  return match ? Number(match[1]) : null;
};

const cleanTitle = (value = "") =>
  String(value)
    .replace(/\b(19\d{2}|20\d{2})\b/g, "")
    .replace(/\s+/g, " ")
    .replace(/^[\s\-–—:|]+|[\s\-–—:|]+$/g, "")
    .trim();

const extractCaptionType = (caption = "") => {
  const text = normalizeText(caption).toLowerCase();

  if (
    /\b(web\s*series|webseries|tv\s*series|tv\s*show|series|show|episode|season)\b/i.test(
      text
    )
  ) {
    return "tv";
  }

  if (
    /\b(movie|film|cinema|motion\s*picture)\b/i.test(
      text
    )
  ) {
    return "movie";
  }

  return "";
};

const extractCaptionTitle = (caption = "") => {
  const raw = String(caption || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();

  if (!raw) {
    return {
      title: "",
      year: null,
      type: "",
    };
  }

  const type = extractCaptionType(raw);

  const labelPatterns = [
    /^\s*(?:movie|movie name|movie title|film|film name|film title)\s*[:\-–—]\s*(.+)$/im,
    /^\s*(?:show|show name|show title|series|series name|series title|web series|webseries)\s*[:\-–—]\s*(.+)$/im,
    /^\s*(?:title|name)\s*[:\-–—]\s*(.+)$/im,
  ];

  for (const pattern of labelPatterns) {
    const match = raw.match(pattern);

    if (!match?.[1]) {
      continue;
    }

    const line = match[1]
      .split("\n")[0]
      .trim();

    const year = extractYear(line);
    const title = cleanTitle(line);

    if (title.length >= 2) {
      return {
        title,
        year,
        type,
      };
    }
  }

  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const ignoredPatterns = [
    /^tag your\b/i,
    /^follow\b/i,
    /^subscribe\b/i,
    /^watch\b/i,
    /^share\b/i,
    /^comment\b/i,
    /^like\b/i,
    /^dm\b/i,
    /^link in bio\b/i,
    /^credits?\b/i,
    /^edit\b/i,
    /^scene\b/i,
    /^reel\b/i,
    /^viral\b/i,
    /^fyp\b/i,
    /^explore\b/i,
    /^insta\b/i,
    /^instagram\b/i,
    /^collab\b/i,
    /^collaboration\b/i,
    /^mention\b/i,
    /^send this\b/i,
    /^share this\b/i,
  ];

  for (const line of lines.slice(0, 8)) {
    const year = extractYear(line);
    const title = cleanTitle(line);

    if (!title) {
      continue;
    }

    if (title.length < 2 || title.length > 100) {
      continue;
    }

    if (
      ignoredPatterns.some((pattern) =>
        pattern.test(title)
      )
    ) {
      continue;
    }

    if (/@/.test(title) || /#/.test(title)) {
      continue;
    }

    const lower = title.toLowerCase();

    if (
      /^(movie|film|show|series|web series|webseries|episode|season|cast|review|trailer|official|watch|story|plot|follow|subscribe)$/i.test(
        lower
      )
    ) {
      continue;
    }

    const wordCount = title.split(/\s+/).length;

    if (wordCount <= 8) {
      return {
        title,
        year,
        type,
      };
    }
  }

  return {
    title: "",
    year: null,
    type,
  };
};

const isUsefulSignal = (value = "") => {
  const text = normalizeText(value);

  if (!text) {
    return false;
  }

  if (text.length < 5 || text.length > 100) {
    return false;
  }

  if (/^[@#.\-_\s]+$/.test(text)) {
    return false;
  }

  const words = text.split(/\s+/).filter(Boolean);

  if (words.length < 2 || words.length > 12) {
    return false;
  }

  const uniqueWords = new Set(
    words.map((word) => word.toLowerCase())
  );

  if (uniqueWords.size < 2) {
    return false;
  }

  const garbagePatterns = [
    /^bahna$/i,
    /^bahen$/i,
    /^sp$/i,
    /^fyp$/i,
    /^viral$/i,
    /^explore$/i,
    /^insta$/i,
    /^instagram$/i,
    /^reels?$/i,
    /^tag your\b/i,
    /^follow\b/i,
    /^subscribe\b/i,
    /^like\b/i,
    /^share\b/i,
    /^comment\b/i,
  ];

  if (
    words.some((word) =>
      garbagePatterns.some((pattern) =>
        pattern.test(word)
      )
    )
  ) {
    return false;
  }

  const letterCount = (
    text.match(/\p{L}/gu) || []
  ).length;

  if (letterCount < 4) {
    return false;
  }

  return true;
};

const getSearchQueries = ({
  captionTitle,
  ocrText,
  speechText,
}) => {
  const queries = [];

  if (captionTitle) {
    queries.push(captionTitle);
  }

  const addTextQueries = (text, source) => {
    if (!text) {
      return;
    }

    const lines = String(text)
      .split(/\n+/)
      .map((line) => normalizeText(line))
      .filter(Boolean);

    const sourceQueries = [];

    for (const line of lines) {
      if (!isUsefulSignal(line)) {
        continue;
      }

      if (
        source === "speech" &&
        line.length > 80
      ) {
        continue;
      }

      sourceQueries.push(line);
    }

    const uniqueSourceQueries =
      unique(sourceQueries);

    queries.push(
      ...uniqueSourceQueries.slice(0, 3)
    );
  };

  addTextQueries(ocrText, "ocr");
  addTextQueries(speechText, "speech");

  return unique(queries).slice(0, 5);
};

const getVisualSignals = (visualAnalysis) => {
  if (
    !visualAnalysis ||
    !Array.isArray(
      visualAnalysis.visualSignals
    )
  ) {
    return [];
  }

  return visualAnalysis.visualSignals
    .map((item) => ({
      description: normalizeText(
        item?.description || ""
      ),
      objects: Array.isArray(item?.objects)
        ? item.objects
        : [],
    }))
    .filter((item) => {
      if (
        item.description.length < 10 ||
        item.description.length > 200
      ) {
        return false;
      }

      return true;
    });
};

const getVisualSearchQueries = (visualSignals = []) => {
  const queries = [];

  for (const item of visualSignals) {
    const description = normalizeText(item?.description || "");

    if (
      description.length < 15 ||
      description.length > 140 ||
      /^(a|an|the) (photo|picture|image|close up|closeup)\b/i.test(description)
    ) {
      continue;
    }

    const words = description.split(/\s+/).filter(Boolean);

    if (words.length >= 3 && words.length <= 18) {
      queries.push(description);
    }
  }

  return unique(queries).slice(0, 2);
};

const tmdbRequest = async (
  path,
  params = {}
) => {
  const url = new URL(
    `${TMDB_BASE_URL}${path}`
  );

  Object.entries(params).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        url.searchParams.set(
          key,
          String(value)
        );
      }
    }
  );

  const controller = new AbortController();
  const timeoutMs = Math.max(
    5000,
    Number(
      process.env.SCENE_FINDER_TMDB_TIMEOUT_MS || 15000
    )
  );

  const timeout = setTimeout(
    () => controller.abort(),
    timeoutMs
  );

  let response;

  try {
    response = await fetch(url, {
      headers: getHeaders(),
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(
        `TMDB request timed out after ${timeoutMs}ms.`,
        { cause: error }
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const body = await response.text();

    throw new Error(
      `TMDB ${response.status}: ${body}`
    );
  }

  return response.json();
};

const searchMovies = async (
  query,
  year
) => {
  const results = [];

  for (const language of [
    "en-US",
    "hi-IN",
  ]) {
    const data = await tmdbRequest(
      "/search/movie",
      {
        query,
        language,
        include_adult: false,
        page: 1,
        year: year || undefined,
      }
    );

    if (Array.isArray(data.results)) {
      results.push(
        ...data.results.map((item) => ({
          ...item,
          contentType: "movie",
        }))
      );
    }
  }

  return results;
};

const searchTv = async (
  query,
  year
) => {
  const results = [];

  for (const language of [
    "en-US",
    "hi-IN",
  ]) {
    const data = await tmdbRequest(
      "/search/tv",
      {
        query,
        language,
        include_adult: false,
        page: 1,
        first_air_date_year:
          year || undefined,
      }
    );

    if (Array.isArray(data.results)) {
      results.push(
        ...data.results.map((item) => ({
          ...item,
          contentType: "tv",
        }))
      );
    }
  }

  return results;
};

const searchMulti = async (query) => {
  const data = await tmdbRequest(
    "/search/multi",
    {
      query,
      language: "en-US",
      include_adult: false,
      page: 1,
    }
  );

  return Array.isArray(data.results)
    ? data.results
        .filter(
          (item) =>
            item.media_type === "movie" ||
            item.media_type === "tv"
        )
        .map((item) => ({
          ...item,
          contentType: item.media_type,
        }))
    : [];
};

const toCandidate = (item) => {
  const contentType =
    item.contentType;

  return {
    contentId: item.id,
    contentType,
    title:
      contentType === "tv"
        ? item.name ||
          item.original_name ||
          ""
        : item.title ||
          item.original_title ||
          "",
    originalTitle:
      contentType === "tv"
        ? item.original_name ||
          item.name ||
          ""
        : item.original_title ||
          item.title ||
          "",
    overview:
      item.overview || "",
    releaseDate:
      contentType === "tv"
        ? item.first_air_date || ""
        : item.release_date || "",
    rating: Number(
      item.vote_average || 0
    ),
    popularity: Number(
      item.popularity || 0
    ),
    image: item.poster_path
      ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
      : "",
  };
};

const deduplicateCandidates = (
  items
) => {
  const map = new Map();

  for (const item of items) {
    if (
      !item?.contentId ||
      !item?.contentType
    ) {
      continue;
    }

    const key = `${item.contentType}-${item.contentId}`;

    if (!map.has(key)) {
      map.set(key, item);
    }
  }

  return [...map.values()];
};

const findSceneCandidates = async ({
  caption = "",
  ocrText = "",
  speechText = "",
  visualAnalysis = null,
}) => {
  const captionInfo =
    extractCaptionTitle(caption);

  const visualSignals =
    getVisualSignals(
      visualAnalysis
    );

  console.log(
    "Scene caption extraction:",
    {
      extractedCaptionTitle:
        captionInfo.title,
      captionYear:
        captionInfo.year,
      captionType:
        captionInfo.type,
    }
  );

  console.log(
    "Visual signals available:",
    visualSignals.length
  );

  const queries =
    getSearchQueries({
      captionTitle:
        captionInfo.title,
      ocrText,
      speechText,
    });

  console.log(
    "Scene search queries:",
    queries
  );

  const visualQueries =
    getVisualSearchQueries(
      visualSignals
    );

  const allCandidates = [];
  const searchedQueries = [];

  const searchQuery = async (query) => {
    const year =
      captionInfo.title &&
      normalizeTitle(query) ===
        normalizeTitle(
          captionInfo.title
        )
        ? captionInfo.year
        : null;

    let results;

    if (
      captionInfo.type === "movie"
    ) {
      results =
        await searchMovies(
          query,
          year
        );
    } else if (
      captionInfo.type === "tv"
    ) {
      results =
        await searchTv(
          query,
          year
        );
    } else {
      const [movies, tv] =
        await Promise.all([
          searchMovies(
            query,
            year
          ),
          searchTv(
            query,
            year
          ),
        ]);

      results = [
        ...movies,
        ...tv,
      ];

      if (!results.length) {
        results =
          await searchMulti(
            query
          );
      }
    }

    searchedQueries.push(query);
    allCandidates.push(
      ...results.map(toCandidate).slice(0, 20)
    );

    return results.length;
  };

  for (const query of queries) {
    await searchQuery(query);
  }

  let candidates =
    deduplicateCandidates(
      allCandidates
    ).slice(0, 60);

  /*
   * Vision fallback:
   * Text is preferred because OCR/speech/caption can carry
   * title-level evidence. If text search produces nothing,
   * use a small number of visual descriptions to discover
   * TMDB candidates, then let CLIP/matcher decide.
   */
  if (!candidates.length && visualQueries.length) {
    console.log(
      "Text candidate search returned 0 candidates. Starting vision candidate fallback:",
      visualQueries
    );

    for (const query of visualQueries) {
      await searchQuery(query);

      candidates =
        deduplicateCandidates(
          allCandidates
        ).slice(0, 60);

      if (candidates.length >= 20) {
        break;
      }
    }
  }

  const searchQueries =
    unique(searchedQueries).slice(0, 7);

  console.log(
    "Scene candidate search:",
    {
      queries: searchQueries,
      extractedCaptionTitle:
        captionInfo.title,
      candidateCount:
        candidates.length,
      visualSignals:
        visualSignals.length,
    }
  );

  if (!searchQueries.length) {
    console.log(
      "No reliable scene queries found from text or vision."
    );
  }

  return {
    candidates,
    extractedCaptionTitle:
      captionInfo.title,
    captionYear:
      captionInfo.year,
    captionType:
      captionInfo.type,
    queries: searchQueries,
    visualSignals,
  };
};

module.exports = {
  findSceneCandidates,
  extractCaptionTitle,
  normalizeTitle,
};
