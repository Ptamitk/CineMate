
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w780";
const TMDB_ORIGINAL_IMAGE_BASE =
  "https://image.tmdb.org/t/p/original";

const genreMap = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

const getGenres = (item) => {
  if (item.genres) {
    return item.genres.map((genre) => genre.name);
  }

  if (item.genre_ids) {
    return item.genre_ids
      .map((id) => genreMap[id])
      .filter(Boolean);
  }

  return [];
};

/* =========================
   MOVIE
========================= */

export const normalizeMovie = (movie) => ({
  id: movie.id,
  type: "movie",

  title: movie.title || "Untitled",

  year: movie.release_date
    ? movie.release_date.slice(0, 4)
    : "N/A",

  rating:
    typeof movie.vote_average === "number"
      ? movie.vote_average.toFixed(1)
      : "N/A",

  image: movie.poster_path
    ? `${TMDB_IMAGE_BASE}${movie.poster_path}`
    : "",

  backdrop: movie.backdrop_path
    ? `${TMDB_ORIGINAL_IMAGE_BASE}${movie.backdrop_path}`
    : "",

  overview: movie.overview || "",

  genres: getGenres(movie),
});

/* =========================
   TV / WEB SERIES
========================= */

export const normalizeTV = (show) => ({
  id: show.id,
  type: "tv",

  title: show.name || "Untitled",

  year: show.first_air_date
    ? show.first_air_date.slice(0, 4)
    : "N/A",

  rating:
    typeof show.vote_average === "number"
      ? show.vote_average.toFixed(1)
      : "N/A",

  image: show.poster_path
    ? `${TMDB_IMAGE_BASE}${show.poster_path}`
    : "",

  backdrop: show.backdrop_path
    ? `${TMDB_ORIGINAL_IMAGE_BASE}${show.backdrop_path}`
    : "",

  overview: show.overview || "",

  genres: getGenres(show),
});

/* =========================
   PERSON
========================= */

export const normalizePerson = (person) => ({
  id: person.id,
  type: "person",

  title: person.name || "Unknown Person",

  year: "",

  rating: "",

  image: person.profile_path
    ? `${TMDB_IMAGE_BASE}${person.profile_path}`
    : "",

  backdrop: "",

  overview: "",

  genres: [],
});

/* =========================
   UNIVERSAL CONTENT
========================= */

export const normalizeContent = (item) => {
  if (!item) {
    return null;
  }

  /*
    IMPORTANT:
    Check media_type first.
    Otherwise a person with a `name`
    could accidentally become TV.
  */

  if (item.media_type === "person") {
    return normalizePerson(item);
  }

  if (item.media_type === "movie") {
    return normalizeMovie(item);
  }

  if (item.media_type === "tv") {
    return normalizeTV(item);
  }

  /*
    Detail / discover APIs may not
    provide media_type.
  */

  if (item.title) {
    return normalizeMovie(item);
  }

  if (item.name) {
    return normalizeTV(item);
  }

  return null;
};

/* =========================
   CONTENT LIST
========================= */

export const normalizeContentList = (items = []) => {
  return items
    .map(normalizeContent)
    .filter(Boolean);
};
