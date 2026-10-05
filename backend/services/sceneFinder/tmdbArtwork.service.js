const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w780";

const getHeaders = () => ({
  Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
  "Content-Type": "application/json",
});

const tmdbRequest = async (path, params = {}) => {
  const url = new URL(`${TMDB_BASE_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    Math.max(5000, Number(process.env.SCENE_FINDER_TMDB_TIMEOUT_MS || 15000))
  );

  try {
    const response = await fetch(url, {
      headers: getHeaders(),
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

const getArtworkForCandidate = async (candidate) => {
  if (!candidate?.contentId || !candidate?.contentType) return [];

  const endpoint =
    candidate.contentType === "tv"
      ? `/tv/${candidate.contentId}`
      : `/movie/${candidate.contentId}`;

  try {
    const data = await tmdbRequest(endpoint, {
      append_to_response: "images",
      language: "en-US",
      include_image_language: "en,null",
    });

    const backdrops = Array.isArray(data?.images?.backdrops)
      ? data.images.backdrops
      : [];

    const posters = Array.isArray(data?.images?.posters)
      ? data.images.posters
      : [];

    const urls = [
      ...backdrops
        .sort((a, b) =>
          Number(b.vote_average || 0) - Number(a.vote_average || 0)
        )
        .slice(0, 5)
        .map((item) => item.file_path)
        .filter(Boolean),
      ...posters
        .sort((a, b) =>
          Number(b.vote_average || 0) - Number(a.vote_average || 0)
        )
        .slice(0, 2)
        .map((item) => item.file_path)
        .filter(Boolean),
    ];

    return [...new Set(urls)].map((filePath) => ({
      label: candidate.title,
      imageUrl: `${IMAGE_BASE_URL}${filePath}`,
      contentId: candidate.contentId,
      contentType: candidate.contentType,
    }));
  } catch (error) {
    console.error(
      `TMDB artwork lookup failed for ${candidate.title}:`,
      error.message
    );
    return [];
  }
};

const getCandidateArtwork = async (candidates = [], limit = 60) => {
  const selected = candidates.slice(0, limit);
  const output = [];
  const concurrency = Math.max(
    1,
    Number(process.env.SCENE_FINDER_ARTWORK_CONCURRENCY || 4)
  );

  for (let index = 0; index < selected.length; index += concurrency) {
    const batch = selected.slice(index, index + concurrency);
    const results = await Promise.all(
      batch.map((candidate) => getArtworkForCandidate(candidate))
    );
    output.push(...results.flat());
  }

  return output;
};

module.exports = {
  getCandidateArtwork,
};