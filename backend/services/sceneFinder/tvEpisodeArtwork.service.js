const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w780";
const cache = new Map();

const request = async (path, params = {}) => {
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
      headers: {
        Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
        accept: "application/json",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`TMDB ${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
};

const getEpisodeArtwork = async (candidate) => {
  if (candidate?.contentType !== "tv" || !candidate.contentId) return [];

  const key = `tv:${candidate.contentId}`;
  if (cache.has(key)) return cache.get(key);

  try {
    const details = await request(`/tv/${candidate.contentId}`, {
      language: "en-US",
    });

    const seasons = (details.seasons || [])
      .filter((season) => Number(season.season_number) > 0)
      .sort((a, b) => Number(b.episode_count || 0) - Number(a.episode_count || 0))
      .slice(0, Math.max(1, Number(process.env.SCENE_FINDER_EPISODE_SEASONS || 8)));

    const concurrency = Math.max(
      2,
      Math.min(5, Number(process.env.SCENE_FINDER_EPISODE_CONCURRENCY || 4))
    );

    const episodes = [];

    for (let index = 0; index < seasons.length; index += concurrency) {
      const batch = seasons.slice(index, index + concurrency);
      const results = await Promise.all(
        batch.map(async (season) => {
          try {
            const data = await request(
              `/tv/${candidate.contentId}/season/${season.season_number}`,
              { language: "en-US" }
            );
            return (data.episodes || [])
              .filter((episode) => episode.still_path)
              .map((episode) => ({
                label: candidate.title,
                contentId: candidate.contentId,
                contentType: "tv",
                seasonNumber: episode.season_number,
                episodeNumber: episode.episode_number,
                episodeName: episode.name || "",
                imageUrl: `${IMAGE_BASE_URL}${episode.still_path}`,
              }));
          } catch (error) {
            console.error(
              `Episode artwork lookup failed for ${candidate.title} S${season.season_number}:`,
              error.message
            );
            return [];
          }
        })
      );

      episodes.push(...results.flat());
    }

    const limited = episodes.slice(
      0,
      Math.max(20, Number(process.env.SCENE_FINDER_MAX_EPISODE_STILLS || 180))
    );

    cache.set(key, limited);
    return limited;
  } catch (error) {
    console.error(`TV episode artwork failed for ${candidate.title}:`, error.message);
    return [];
  }
};

const getCandidateEpisodeArtwork = async (candidates = [], limit = 10) => {
  const tvCandidates = candidates
    .filter((candidate) => candidate?.contentType === "tv")
    .slice(0, limit);

  const output = [];
  const concurrency = 3;

  for (let index = 0; index < tvCandidates.length; index += concurrency) {
    const batch = tvCandidates.slice(index, index + concurrency);
    const results = await Promise.all(
      batch.map((candidate) => getEpisodeArtwork(candidate))
    );
    output.push(...results.flat());
  }

  return output;
};

module.exports = {
  getCandidateEpisodeArtwork,
};