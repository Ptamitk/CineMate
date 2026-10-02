
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const tmdbFetch = async (endpoint) => {
  const response = await fetch(`${TMDB_BASE_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_TMDB_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`TMDB API Error: ${response.status}`);
  }

  return response.json();
};

/* =========================
   MOVIES
========================= */

export const getPopularMovies = () =>
  tmdbFetch("/movie/popular?language=en-US&page=1");

export const getTrendingMovies = () =>
  tmdbFetch("/trending/movie/week?language=en-US");

export const getUpcomingMovies = () =>
  tmdbFetch("/movie/upcoming?language=en-US&page=1");

export const searchMovies = (query) =>
  tmdbFetch(
    `/search/movie?query=${encodeURIComponent(query)}&language=en-US&page=1`
  );

export const getMovieDetails = (movieId) =>
  tmdbFetch(`/movie/${movieId}?language=en-US`);

/* =========================
   MOVIE GENRES
========================= */

export const getMovieGenres = () =>
  tmdbFetch("/genre/movie/list?language=en-US");

/* =========================
   TV / WEB SERIES
========================= */

export const getPopularTVShows = () =>
  tmdbFetch("/tv/popular?language=en-US&page=1");

export const getTrendingTVShows = () =>
  tmdbFetch("/trending/tv/week?language=en-US");

export const searchTVShows = (query) =>
  tmdbFetch(
    `/search/tv?query=${encodeURIComponent(query)}&language=en-US&page=1`
  );

export const getTVDetails = (tvId) =>
  tmdbFetch(`/tv/${tvId}?language=en-US`);

export const getTVSeasonDetails = (tvId, seasonNumber) => {
  return tmdbFetch(
    `/tv/${tvId}/season/${seasonNumber}?language=en-US`
  );
};

/* =========================
   TV GENRES
========================= */

export const getTVGenres = () =>
  tmdbFetch("/genre/tv/list?language=en-US");


/* =========================
   DISCOVER BY GENRE
========================= */

export const discoverMoviesByGenre = (genreId) =>
  tmdbFetch(
    `/discover/movie?with_genres=${genreId}&language=en-US&page=1&sort_by=popularity.desc`
  );

export const discoverTVByGenre = (genreId) =>
  tmdbFetch(
    `/discover/tv?with_genres=${genreId}&language=en-US&page=1&sort_by=popularity.desc`
  );

  export const discoverMovies = ({
  genre = "",
  rating = "",
  year = "",
  sort = "popularity.desc",
} = {}) => {
  const params = new URLSearchParams({
    language: "en-US",
    page: "1",
    sort_by: sort,
  });

  if (genre) {
    params.set("with_genres", genre);
  }

  if (rating) {
    params.set("vote_average.gte", rating);
  }

  if (year) {
    params.set("primary_release_year", year);
  }

  return tmdbFetch(
    `/discover/movie?${params.toString()}`
  );
};

export const discoverTVShows = ({
  genre = "",
  rating = "",
  year = "",
  sort = "popularity.desc",
} = {}) => {
  const params = new URLSearchParams({
    language: "en-US",
    page: "1",
    sort_by: sort,
  });

  if (genre) {
    params.set("with_genres", genre);
  }

  if (rating) {
    params.set("vote_average.gte", rating);
  }

  if (year) {
    params.set("first_air_date_year", year);
  }

  return tmdbFetch(
    `/discover/tv?${params.toString()}`
  );
};


/* =========================
   UNIVERSAL SEARCH
========================= */

export const searchMulti = (query) =>
  tmdbFetch(
    `/search/multi?query=${encodeURIComponent(query)}&language=en-US&page=1`
  );

/* =========================
   PEOPLE
========================= */

export const searchPeople = (query) =>
  tmdbFetch(
    `/search/person?query=${encodeURIComponent(query)}&language=en-US&page=1`
  );

export const getPersonDetails = (personId) =>
  tmdbFetch(
    `/person/${personId}?language=en-US&append_to_response=combined_credits`
  );

export const getMovieCredits = (movieId) => {
  return tmdbFetch(
    `/movie/${movieId}/credits?language=en-US`
  );
};

export const getTVCredits = (tvId) => {
  return tmdbFetch(
    `/tv/${tvId}/credits?language=en-US`
  );
};

export const getPopularPeople = () =>
  tmdbFetch(
    "/person/popular?language=en-US&page=1"
  );



/* =========================
   VIDEOS / TRAILERS
========================= */

export const getMovieVideos = (movieId) => {
  return tmdbFetch(
    `/movie/${movieId}/videos?language=en-US`
  );
};

export const getTVVideos = (tvId) => {
  return tmdbFetch(
    `/tv/${tvId}/videos?language=en-US`
  );
};

/* =========================
   WATCH PROVIDERS
========================= */

export const getMovieWatchProviders = (movieId) => {
  return tmdbFetch(
    `/movie/${movieId}/watch/providers`
  );
};

export const getTVWatchProviders = (tvId) => {
  return tmdbFetch(
    `/tv/${tvId}/watch/providers`
  );
};

/* =========================
   SIMILAR / RECOMMENDED
========================= */

export const getSimilarMovies = (movieId) => {
  return tmdbFetch(
    `/movie/${movieId}/similar?language=en-US&page=1`
  );
};

export const getRecommendedMovies = (movieId) => {
  return tmdbFetch(
    `/movie/${movieId}/recommendations?language=en-US&page=1`
  );
};

export const getSimilarTVShows = (tvId) => {
  return tmdbFetch(
    `/tv/${tvId}/similar?language=en-US&page=1`
  );
};

export const getRecommendedTVShows = (tvId) => {
  return tmdbFetch(
    `/tv/${tvId}/recommendations?language=en-US&page=1`
  );
};

