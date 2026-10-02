
import { useEffect } from "react";
import { X } from "lucide-react";

const MOVIE_GENRES = [
  { id: "28", name: "Action" },
  { id: "12", name: "Adventure" },
  { id: "16", name: "Animation" },
  { id: "35", name: "Comedy" },
  { id: "80", name: "Crime" },
  { id: "18", name: "Drama" },
  { id: "14", name: "Fantasy" },
  { id: "27", name: "Horror" },
  { id: "9648", name: "Mystery" },
  { id: "10749", name: "Romance" },
  { id: "878", name: "Sci-Fi" },
  { id: "53", name: "Thriller" },
];

const TV_GENRES = [
  { id: "10759", name: "Action & Adventure" },
  { id: "16", name: "Animation" },
  { id: "35", name: "Comedy" },
  { id: "80", name: "Crime" },
  { id: "99", name: "Documentary" },
  { id: "18", name: "Drama" },
  { id: "10751", name: "Family" },
  { id: "10762", name: "Kids" },
  { id: "9648", name: "Mystery" },
  { id: "10763", name: "News" },
  { id: "10764", name: "Reality" },
  { id: "10765", name: "Sci-Fi & Fantasy" },
  { id: "10766", name: "Soap" },
  { id: "10767", name: "Talk" },
  { id: "10768", name: "War & Politics" },
];

const MOVIE_SORT_OPTIONS = [
  {
    value: "popularity.desc",
    label: "Popularity",
  },
  {
    value: "vote_average.desc",
    label: "Rating",
  },
  {
    value: "primary_release_date.desc",
    label: "Newest",
  },
  {
    value: "primary_release_date.asc",
    label: "Oldest",
  },
];

const TV_SORT_OPTIONS = [
  {
    value: "popularity.desc",
    label: "Popularity",
  },
  {
    value: "vote_average.desc",
    label: "Rating",
  },
  {
    value: "first_air_date.desc",
    label: "Newest",
  },
  {
    value: "first_air_date.asc",
    label: "Oldest",
  },
];

const YEAR_OPTIONS = [
  "2026",
  "2025",
  "2024",
  "2023",
  "2022",
  "2021",
  "2020",
];

const FilterPanel = ({
  isOpen,
  onClose,
  filters,
  onChange,
  onClear,
  onApply,
  contentType = "movie",
}) => {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    if (window.lenis) {
      window.lenis.stop();
    }

    return () => {
      document.body.style.overflow =
        previousOverflow;

      if (window.lenis) {
        window.lenis.start();
      }
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const isTV = contentType === "tv";

  const genres = isTV
    ? TV_GENRES
    : MOVIE_GENRES;

  const sortOptions = isTV
    ? TV_SORT_OPTIONS
    : MOVIE_SORT_OPTIONS;

  const title = isTV
    ? "Filter TV Shows"
    : "Filter Movies";

  const genreId = isTV
    ? "tv-genre"
    : "movie-genre";

  const ratingId = isTV
    ? "tv-rating"
    : "movie-rating";

  const yearId = isTV
    ? "tv-year"
    : "movie-year";

  const sortId = isTV
    ? "tv-sort"
    : "movie-sort";

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6">

      <div className="w-full max-w-2xl overflow-hidden rounded-t-3xl border border-white/10 bg-[#0a0a0a] shadow-2xl sm:rounded-3xl">

        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-white/10 px-5 py-5 sm:px-7">

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/30">
              Discover
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>

        </div>

        {/* FILTER CONTENT */}

        <div className="max-h-[65vh] overflow-y-auto px-5 py-6 sm:px-7">

          {/* GENRE */}

          <div>
            <label
              htmlFor={genreId}
              className="text-xs uppercase tracking-[0.18em] text-white/35"
            >
              Genre
            </label>

            <select
              id={genreId}
              value={filters.genre}
              onChange={(event) =>
                onChange(
                  "genre",
                  event.target.value
                )
              }
              className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-white/25"
            >
              <option
                value=""
                className="bg-black"
              >
                All Genres
              </option>

              {genres.map((genre) => (
                <option
                  key={genre.id}
                  value={genre.id}
                  className="bg-black"
                >
                  {genre.name}
                </option>
              ))}
            </select>
          </div>

          {/* RATING */}

          <div className="mt-6">
            <label
              htmlFor={ratingId}
              className="text-xs uppercase tracking-[0.18em] text-white/35"
            >
              Minimum Rating
            </label>

            <select
              id={ratingId}
              value={filters.rating}
              onChange={(event) =>
                onChange(
                  "rating",
                  event.target.value
                )
              }
              className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-white/25"
            >
              <option
                value=""
                className="bg-black"
              >
                Any Rating
              </option>

              <option
                value="5"
                className="bg-black"
              >
                5+
              </option>

              <option
                value="6"
                className="bg-black"
              >
                6+
              </option>

              <option
                value="7"
                className="bg-black"
              >
                7+
              </option>

              <option
                value="8"
                className="bg-black"
              >
                8+
              </option>

              <option
                value="9"
                className="bg-black"
              >
                9+
              </option>
            </select>
          </div>

          {/* YEAR */}

          <div className="mt-6">
            <label
              htmlFor={yearId}
              className="text-xs uppercase tracking-[0.18em] text-white/35"
            >
              {isTV
                ? "First Air Year"
                : "Release Year"}
            </label>

            <select
              id={yearId}
              value={filters.year}
              onChange={(event) =>
                onChange(
                  "year",
                  event.target.value
                )
              }
              className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-white/25"
            >
              <option
                value=""
                className="bg-black"
              >
                Any Year
              </option>

              {YEAR_OPTIONS.map((year) => (
                <option
                  key={year}
                  value={year}
                  className="bg-black"
                >
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* SORT */}

          <div className="mt-6">
            <label
              htmlFor={sortId}
              className="text-xs uppercase tracking-[0.18em] text-white/35"
            >
              Sort By
            </label>

            <select
              id={sortId}
              value={filters.sort}
              onChange={(event) =>
                onChange(
                  "sort",
                  event.target.value
                )
              }
              className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-white/25"
            >
              {sortOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  className="bg-black"
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* FOOTER */}

        <div className="flex gap-3 border-t border-white/10 px-5 py-5 sm:px-7">

          <button
            type="button"
            onClick={onClear}
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white/60 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={onApply}
            className="flex-1 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(255,255,255,0.15)]"
          >
            Apply Filters
          </button>

        </div>

      </div>
    </div>
  );
};

export default FilterPanel;


