const TMDB_BASE_URL =
"https://api.themoviedb.org/3";

const tmdbFetch = async (endpoint) => {
const response = await fetch(
`${TMDB_BASE_URL}${endpoint}`,
{
headers: {
Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
"Content-Type": "application/json",
},
}
);

if (!response.ok) {
throw new Error(
`TMDB API Error: ${response.status}`
);
}

return response.json();
};

const searchMovies = async (query) => {
return tmdbFetch(
`/search/movie?query=${encodeURIComponent(
      query
    )}&language=en-US&page=1`
);
};

const searchTVShows = async (query) => {
return tmdbFetch(
`/search/tv?query=${encodeURIComponent(
      query
    )}&language=en-US&page=1`
);
};

const handleTelegramText = async (text) => {
const query = text?.trim();

if (!query) {
return {
type: "empty",
message:
"Please send a movie or TV show name.",
};
}

const [movieResult, tvResult] =
await Promise.all([
searchMovies(query),
searchTVShows(query),
]);

const movies =
movieResult?.results || [];

const tvShows =
tvResult?.results || [];

const results = [
...movies.slice(0, 5).map((item) => ({
type: "movie",
id: item.id,
title: item.title,
overview:
item.overview || "",
posterPath:
item.poster_path || null,
releaseDate:
item.release_date || "",
rating:
item.vote_average || 0,
})),


...tvShows.slice(0, 5).map((item) => ({
  type: "tv",
  id: item.id,
  title: item.name,
  overview:
    item.overview || "",
  posterPath:
    item.poster_path || null,
  releaseDate:
    item.first_air_date || "",
  rating:
    item.vote_average || 0,
})),


];

return {
type: "search",
query,
results,
};
};

module.exports = {
handleTelegramText,
};