
import { useEffect, useState } from "react";

import {
  Search as SearchIcon,
  X,
} from "lucide-react";

import {
  useSearchParams,
} from "react-router-dom";

import { contentService } from "../../services/content/contentService";

import ContentGrid from "../../components/content/ContentGrid";

import { useAuth } from "../../context/AuthContext";

const Search = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  const {
    telegramSearchResult,
    clearTelegramSearchResult,
  } = useAuth();

  const query =
    searchParams.get("q") || "";

  const genre =
    searchParams.get("genre");

  const genreType =
    searchParams.get("type");

  const selectedType =
    searchParams.get("content") || "all";

  const hasGenreSearch =
    Boolean(genre) &&
    (genreType === "movie" ||
      genreType === "tv");

  const typeOptions = [
    {
      value: "all",
      label: "All",
    },
    {
      value: "movie",
      label: "Movies",
    },
    {
      value: "tv",
      label: "TV Shows",
    },
    {
      value: "person",
      label: "People",
    },
  ];

  /* =========================
     TELEGRAM SEARCH
  ========================= */

  useEffect(() => {
    if (!telegramSearchResult?.query) {
      return;
    }

    const telegramQuery =
      telegramSearchResult.query.trim();

    if (!telegramQuery) {
      return;
    }

    const nextParams =
      new URLSearchParams(searchParams);

    nextParams.set(
      "q",
      telegramQuery
    );

    nextParams.delete("genre");
    nextParams.delete("type");

    setSearchParams(nextParams);

    clearTelegramSearchResult();
  }, [
    telegramSearchResult,
    searchParams,
    setSearchParams,
    clearTelegramSearchResult,
  ]);

  /* =========================
     SEARCH
  ========================= */

  useEffect(() => {
    const trimmedQuery =
      query.trim();

    /* =========================
       GENRE SEARCH
    ========================= */

    if (
      hasGenreSearch &&
      !trimmedQuery
    ) {
      const fetchGenreResults =
        async () => {
          try {
            setLoading(true);

            let data;

            if (genreType === "movie") {
              data =
                await contentService.movies.discoverByGenre(
                  genre
                );
            } else {
              data =
                await contentService.tv.discoverByGenre(
                  genre
                );
            }

            const normalizedResults =
              (data.results || []).map(
                (item) => ({
                  id: item.id,

                  title:
                    genreType === "tv"
                      ? item.name
                      : item.title,

                  image: item.poster_path
                    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                    : "",

                  year:
                    genreType === "tv"
                      ? item.first_air_date
                        ? item.first_air_date.slice(
                            0,
                            4
                          )
                        : ""
                      : item.release_date
                        ? item.release_date.slice(
                            0,
                            4
                          )
                        : "",

                  rating:
                    typeof item.vote_average ===
                    "number"
                      ? item.vote_average.toFixed(
                          1
                        )
                      : "",

                  type: genreType,
                })
              );

            setResults(
              normalizedResults
            );
          } catch (error) {
            console.error(
              "Genre Search Error:",
              error
            );

            setResults([]);
          } finally {
            setLoading(false);
          }
        };

      fetchGenreResults();

      return;
    }

    /* =========================
       EMPTY SEARCH
    ========================= */

    if (!trimmedQuery) {
      setResults([]);
      setLoading(false);

      return;
    }

    /* =========================
       UNIVERSAL SEARCH
    ========================= */

    const timer = setTimeout(
      async () => {
        try {
          setLoading(true);

          const data =
            await contentService.universal.search(
              trimmedQuery
            );

          const normalizedResults =
            (data.results || [])
              .filter((item) => {
                const allowedTypes = [
                  "movie",
                  "tv",
                  "person",
                ];

                if (
                  !allowedTypes.includes(
                    item.media_type
                  )
                ) {
                  return false;
                }

                if (
                  selectedType === "all"
                ) {
                  return true;
                }

                return (
                  item.media_type ===
                  selectedType
                );
              })
              .map((item) => ({
                id: item.id,

                title:
                  item.media_type === "person"
                    ? item.name
                    : item.media_type === "tv"
                      ? item.name
                      : item.title,

                image: item.profile_path
                  ? `https://image.tmdb.org/t/p/w500${item.profile_path}`
                  : item.poster_path
                    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                    : "",

                year:
                  item.media_type === "tv"
                    ? item.first_air_date
                      ? item.first_air_date.slice(
                          0,
                          4
                        )
                      : ""
                    : item.media_type === "movie"
                      ? item.release_date
                        ? item.release_date.slice(
                            0,
                            4
                          )
                        : ""
                      : "",

                rating:
                  typeof item.vote_average ===
                  "number"
                    ? item.vote_average.toFixed(
                        1
                      )
                    : "",

                type: item.media_type,
              }));

          setResults(
            normalizedResults
          );
        } catch (error) {
          console.error(
            "Search Error:",
            error
          );

          setResults([]);
        } finally {
          setLoading(false);
        }
      },
      500
    );

    return () =>
      clearTimeout(timer);
  }, [
    query,
    genre,
    genreType,
    hasGenreSearch,
    selectedType,
  ]);

  /* =========================
     QUERY CHANGE
  ========================= */

  const handleSearchChange = (
    event
  ) => {
    const value =
      event.target.value;

    const nextParams =
      new URLSearchParams(
        searchParams
      );

    if (value.trim()) {
      nextParams.set(
        "q",
        value
      );
    } else {
      nextParams.delete("q");
    }

    setSearchParams(nextParams);
  };

  /* =========================
     CLEAR SEARCH
  ========================= */

  const clearSearch = () => {
    const nextParams =
      new URLSearchParams(
        searchParams
      );

    nextParams.delete("q");

    setSearchParams(nextParams);
  };

  /* =========================
     TYPE CHANGE
  ========================= */

  const handleTypeChange = (
    type
  ) => {
    const nextParams =
      new URLSearchParams(
        searchParams
      );

    if (type === "all") {
      nextParams.delete(
        "content"
      );
    } else {
      nextParams.set(
        "content",
        type
      );
    }

    setSearchParams(nextParams);
  };

  const isNormalSearch =
    query.trim().length > 0;

  const typeLabel =
    selectedType === "movie"
      ? "Movies"
      : selectedType === "tv"
        ? "TV Shows"
        : selectedType === "person"
          ? "People"
          : "All";

  return (
    <main className="min-h-screen bg-black px-5 pb-20 pt-32 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">

        {/* =========================
            HEADER
        ========================= */}

        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.2em] text-white/30">
            CineMate
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Search
          </h1>

          <p className="mt-3 max-w-2xl text-sm text-white/40 sm:text-base">
            Find movies, TV shows, web series,
            actors and more.
          </p>
        </div>

        {/* =========================
            SEARCH INPUT
        ========================= */}

        <div className="relative max-w-3xl">
          <SearchIcon
            size={20}
            className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-white/30"
          />

          <input
            type="text"
            value={query}
            onChange={
              handleSearchChange
            }
            placeholder="Search movies, TV shows, actors..."
            aria-label="Search CineMate"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-4 pl-14 pr-14 text-base text-white outline-none backdrop-blur-md transition focus:border-white/25 focus:bg-white/[0.06]"
          />

          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white"
              aria-label="Clear search"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* =========================
            TYPE FILTER
        ========================= */}

        <div className="mt-6 flex flex-wrap gap-2">
          {typeOptions.map(
            (option) => {
              const isActive =
                selectedType ===
                option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    handleTypeChange(
                      option.value
                    )
                  }
                  className={`rounded-full border px-4 py-2 text-xs font-medium transition-all duration-300 ${
                    isActive
                      ? "border-white bg-white text-black"
                      : "border-white/10 bg-white/[0.04] text-white/45 hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              );
            }
          )}
        </div>

        {/* =========================
            RESULTS
        ========================= */}

        <div className="mt-10">
          {loading ? (
            <div className="py-10 text-sm text-white/40">
              {hasGenreSearch &&
              !isNormalSearch
                ? "Loading genre results..."
                : "Searching..."}
            </div>
          ) : isNormalSearch &&
            results.length > 0 ? (
            <>
              <div className="mb-6">
                <p className="text-sm text-white/40">
                  Search results for{" "}

                  <span className="font-medium text-white">
                    "{query.trim()}"
                  </span>

                  <span className="ml-2 text-white/25">
                    · {typeLabel}
                  </span>
                </p>
              </div>

              <ContentGrid
                items={results}
              />
            </>
          ) : hasGenreSearch &&
            results.length > 0 ? (
            <>
              <div className="mb-6">
                <p className="text-sm text-white/40">
                  Showing{" "}

                  <span className="font-medium text-white">
                    {genreType === "movie"
                      ? "movie"
                      : "TV show"}
                  </span>{" "}

                  results for this genre.
                </p>
              </div>

              <ContentGrid
                items={results}
              />
            </>
          ) : isNormalSearch ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
              <SearchIcon
                size={32}
                className="mx-auto text-white/20"
              />

              <h2 className="mt-5 text-xl font-semibold">
                No results found
              </h2>

              <p className="mt-2 text-sm text-white/35">
                Try searching with a
                different name or keyword.
              </p>
            </div>
          ) : hasGenreSearch ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
              <SearchIcon
                size={32}
                className="mx-auto text-white/20"
              />

              <h2 className="mt-5 text-xl font-semibold">
                No content found
              </h2>

              <p className="mt-2 text-sm text-white/35">
                Try exploring another
                genre.
              </p>
            </div>
          ) : (
            <div className="py-20 text-center">
              <SearchIcon
                size={42}
                className="mx-auto text-white/15"
              />

              <h2 className="mt-5 text-xl font-semibold text-white/70">
                What are you looking for?
              </h2>

              <p className="mt-2 text-sm text-white/30">
                Search for movies, TV shows,
                actors and more.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default Search;
