
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import gsap from "gsap";

import {
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { contentService } from "../../services/content/contentService";

import ContentGrid from "../../components/content/ContentGrid";

import {
  normalizeContentList,
} from "../../services/content/contentNormalizer";

import FilterPanel from "../../components/content/FilterPanel";

const DEFAULT_FILTERS = {
  genre: "",
  rating: "",
  year: "",
  sort: "popularity.desc",
};

const TVShows = () => {
  const pageRef = useRef(null);

  const [search, setSearch] = useState("");
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isFilterOpen, setIsFilterOpen] =
    useState(false);

  const [filters, setFilters] =
    useState(DEFAULT_FILTERS);

  const [appliedFilters, setAppliedFilters] =
    useState(DEFAULT_FILTERS);

  /* =========================
     LOAD POPULAR / SEARCH /
     FILTERED TV
  ========================= */

  useEffect(() => {
    const query = search.trim();

    const fetchShows = async () => {
      try {
        setLoading(true);

        const hasFilters =
          appliedFilters.genre ||
          appliedFilters.rating ||
          appliedFilters.year ||
          appliedFilters.sort !==
            "popularity.desc";

        let data;

        if (query) {
          data =
            await contentService.tv.search(query);
        } else if (hasFilters) {
          data =
            await contentService.tv.discover(
              appliedFilters
            );
        } else {
          data =
            await contentService.tv.popular();
        }

        const normalizedShows =
          normalizeContentList(
            data.results || []
          );

        setShows(normalizedShows);
      } catch (error) {
        console.error(
          query
            ? "TMDB TV SEARCH ERROR:"
            : "TMDB TV ERROR:",
          error
        );

        setShows([]);
      } finally {
        setLoading(false);
      }
    };

    /* =========================
       POPULAR TV SHOWS
    ========================= */

    if (!query) {
      fetchShows();
      return;
    }

    /* =========================
       DEBOUNCED SEARCH
    ========================= */

    const timer = setTimeout(() => {
      fetchShows();
    }, 500);

    return () => clearTimeout(timer);
  }, [search, appliedFilters]);

  /* =========================
     INTRO ANIMATION
  ========================= */

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const intro = gsap.timeline({
        defaults: {
          ease: "power4.out",
        },
      });

      intro
        .from(".tv-badge", {
          y: 25,
          opacity: 0,
          duration: 0.6,
        })
        .from(
          ".tv-title",
          {
            y: 70,
            opacity: 0,
            duration: 0.9,
          },
          "-=0.3"
        )
        .from(
          ".tv-description",
          {
            y: 25,
            opacity: 0,
            duration: 0.6,
          },
          "-=0.5"
        )
        .from(
          ".tv-tools",
          {
            y: 25,
            opacity: 0,
            duration: 0.6,
          },
          "-=0.4"
        );
    }, pageRef);

    return () => {
      ctx.revert();
    };
  }, []);

  /* =========================
     SEARCH
  ========================= */

  const clearSearch = () => {
    setSearch("");
  };

  /* =========================
     FILTERS
  ========================= */

  const handleFilterChange = (
    key,
    value
  ) => {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const applyFilters = () => {
    setAppliedFilters({
      ...filters,
    });

    setIsFilterOpen(false);
  };

  const clearFilters = () => {
    setFilters({
      ...DEFAULT_FILTERS,
    });

    setAppliedFilters({
      ...DEFAULT_FILTERS,
    });

    setIsFilterOpen(false);
  };

  const hasAppliedFilters =
    appliedFilters.genre ||
    appliedFilters.rating ||
    appliedFilters.year ||
    appliedFilters.sort !==
      "popularity.desc";

  /* =========================
     SECTION TITLE
  ========================= */

  const sectionTitle = search.trim()
    ? `Search results for "${search.trim()}"`
    : hasAppliedFilters
      ? "Filtered TV Shows"
      : "Popular TV Shows & Web Series";

  return (
    <main
      ref={pageRef}
      className="min-h-screen bg-black px-5 pb-20 pt-32 text-white sm:px-8 lg:px-12 lg:pb-28"
    >
      <div className="mx-auto max-w-[1600px]">

        {/* =========================
            HEADER
        ========================= */}

        <section className="max-w-4xl">

          <div className="tv-badge inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/55 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_10px_white]" />

            Explore TV & Web Series
          </div>

          <h1 className="tv-title mt-6 text-5xl font-bold tracking-[-0.04em] sm:text-7xl lg:text-8xl">
            TV Shows
            <span className="text-white/30">
              .
            </span>
          </h1>

          <p className="tv-description mt-6 max-w-2xl text-base leading-7 text-white/45 sm:text-lg">
            Discover popular TV shows and web series,
            from worldwide hits to stories worth discovering.
          </p>

        </section>

        {/* =========================
            TOOLS
        ========================= */}

        <section className="tv-tools mt-12 flex flex-col gap-3 border-y border-white/10 py-5 sm:flex-row sm:items-center sm:justify-between">

          {/* SEARCH */}

          <div className="group flex h-12 w-full max-w-xl items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 transition-all duration-300 focus-within:border-white/25 focus-within:bg-white/[0.06]">

            <Search
              size={19}
              className="text-white/35 transition-colors duration-300 group-focus-within:text-white"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search TV shows & web series..."
              aria-label="Search TV shows and web series"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
            />

            {search && (
              <button
                type="button"
                onClick={clearSearch}
                className="text-white/30 transition-colors duration-200 hover:text-white"
                aria-label="Clear search"
              >
                <X size={17} />
              </button>
            )}

          </div>

          {/* FILTER BUTTON */}

          <button
            type="button"
            onClick={() =>
              setIsFilterOpen(true)
            }
            className="group flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 text-sm text-white/55 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.07] hover:text-white"
          >
            <SlidersHorizontal
              size={18}
              className="transition-transform duration-300 group-hover:rotate-90"
            />

            Filters

            {hasAppliedFilters && (
              <span className="h-2 w-2 rounded-full bg-white shadow-[0_0_10px_white]" />
            )}
          </button>

        </section>

        {/* =========================
            CONTENT
        ========================= */}

        <section className="mt-10">

          <div className="flex items-center justify-between gap-4">

            <h2 className="text-xl font-semibold sm:text-2xl">
              {sectionTitle}
            </h2>

            <span className="shrink-0 text-xs text-white/30">
              {loading
                ? "..."
                : `${shows.length} shows`}
            </span>

          </div>

          <div className="mt-7">

            <ContentGrid
              items={shows}
              loading={loading}
              animation="depth"
            />

          </div>

        </section>

      </div>

      {/* =========================
          FILTER PANEL
      ========================= */}

      <FilterPanel
        isOpen={isFilterOpen}
        onClose={() =>
          setIsFilterOpen(false)
        }
        filters={filters}
        onChange={handleFilterChange}
        onClear={clearFilters}
        onApply={applyFilters}
      />

    </main>
  );
};

export default TVShows;
