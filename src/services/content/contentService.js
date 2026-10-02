
import {
  /* =========================
     MOVIES
  ========================= */

  getPopularMovies,
  getTrendingMovies,
  getUpcomingMovies,
  getMovieDetails,
  searchMovies,
  getMovieCredits,
  getMovieVideos,
  getMovieWatchProviders,
  getSimilarMovies,
  getRecommendedMovies,
  discoverMoviesByGenre,
  discoverMovies,

  /* =========================
     TV / WEB SERIES
  ========================= */

  getPopularTVShows,
  getTrendingTVShows,
  getTVDetails,
  searchTVShows,
  getTVCredits,
  getTVVideos,
  getTVWatchProviders,
  getSimilarTVShows,
  getRecommendedTVShows,
  discoverTVByGenre,
  discoverTVShows,
  getTVSeasonDetails,

  /* =========================
     PEOPLE
  ========================= */

  getPopularPeople,
  searchPeople,
  getPersonDetails,

  /* =========================
     UNIVERSAL SEARCH
  ========================= */

  searchMulti,
} from "../tmdb";

export const contentService = {
  movies: {
    popular: getPopularMovies,
    trending: getTrendingMovies,
    upcoming: getUpcomingMovies,
    search: searchMovies,
    details: getMovieDetails,
    credits: getMovieCredits,
    videos: getMovieVideos,
    watchProviders: getMovieWatchProviders,
    similar: getSimilarMovies,
    recommended: getRecommendedMovies,
    discoverByGenre: discoverMoviesByGenre,
    discover: discoverMovies,
  },

  tv: {
    popular: getPopularTVShows,
    trending: getTrendingTVShows,
    search: searchTVShows,
    details: getTVDetails,
    credits: getTVCredits,
    videos: getTVVideos,
    watchProviders: getTVWatchProviders,
    similar: getSimilarTVShows,
    recommended: getRecommendedTVShows,
    discoverByGenre: discoverTVByGenre,
    discover: discoverTVShows,
    seasonDetails: getTVSeasonDetails,
  },

  people: {
    popular: getPopularPeople,
    search: searchPeople,
    details: getPersonDetails,
  },

  universal: {
    search: searchMulti,
  },
};
