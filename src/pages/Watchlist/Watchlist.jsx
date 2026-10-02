import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";

import ContentGrid from "../../components/content/ContentGrid";
import {
getWatchlist,
removeFromWatchlist,
} from "../../utils/watchlist";

const Watchlist = () => {
const [watchlist, setWatchlist] = useState([]);
const [activeFilter, setActiveFilter] =
useState("all");
const [loading, setLoading] = useState(true);

/* =========================
LOAD WATCHLIST
========================= */

useEffect(() => {
let mounted = true;


const syncWatchlist = async () => {
  try {
    setLoading(true);

    const savedItems =
      await getWatchlist();

    if (mounted) {
      setWatchlist(
        Array.isArray(savedItems)
          ? savedItems
          : []
      );
    }
  } catch (error) {
    console.error(
      "Watchlist Load Error:",
      error
    );

    if (mounted) {
      setWatchlist([]);
    }
  } finally {
    if (mounted) {
      setLoading(false);
    }
  }
};

syncWatchlist();

const handleWatchlistUpdate = () => {
  syncWatchlist();
};

window.addEventListener(
  "watchlistUpdated",
  handleWatchlistUpdate
);

return () => {
  mounted = false;

  window.removeEventListener(
    "watchlistUpdated",
    handleWatchlistUpdate
  );
};


}, []);

/* =========================
REMOVE
========================= */

const handleRemove = async (
contentId,
contentType
) => {
try {
const updatedWatchlist =
await removeFromWatchlist(
contentId,
contentType
);


  const safeWatchlist =
    Array.isArray(updatedWatchlist)
      ? updatedWatchlist
      : [];

  setWatchlist(safeWatchlist);

  window.dispatchEvent(
    new Event("watchlistUpdated")
  );
} catch (error) {
  console.error(
    "Watchlist Remove Error:",
    error
  );
}


};

const filteredWatchlist =
activeFilter === "all"
? watchlist
: watchlist.filter(
(item) =>
item?.contentType ===
activeFilter
);

const filterLabel =
activeFilter === "movie"
? "movies"
: "TV shows";

return ( <main className="min-h-screen bg-black px-5 pb-20 pt-32 text-white sm:px-8 lg:px-12"> <div className="mx-auto max-w-[1600px]">


    {/* =========================
        HEADER
    ========================= */}

    <div className="mb-10">

      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs uppercase tracking-[0.15em] text-white/40">
        <Bookmark size={14} />
        Your Library
      </div>

      <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
        Watchlist
      </h1>

      <p className="mt-3 max-w-2xl text-sm text-white/40 sm:text-base">
        Keep track of movies and TV shows you want to watch.
      </p>

    </div>

    {/* =========================
        LOADING
    ========================= */}

    {loading ? (
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-20 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-white" />

        <p className="mt-5 text-sm text-white/30">
          Loading your watchlist...
        </p>
      </div>
    ) : watchlist.length === 0 ? (
      /* =========================
         EMPTY WATCHLIST
      ========================= */

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-20 text-center">

        <Bookmark
          size={42}
          className="mx-auto text-white/15"
        />

        <h2 className="mt-5 text-xl font-semibold">
          Your watchlist is empty
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm text-white/30">
          Browse CineMate and bookmark movies or TV shows
          you want to watch later.
        </p>

      </div>
    ) : (
      <>
        {/* =========================
            FILTERS + COUNT
        ========================= */}

        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

          <p className="text-sm text-white/40">
            {filteredWatchlist.length}{" "}
            {filteredWatchlist.length === 1
              ? "item"
              : "items"}{" "}
            saved
          </p>

          <div
            className="flex w-fit rounded-full border border-white/10 bg-white/[0.03] p-1"
            role="tablist"
            aria-label="Watchlist filters"
          >

            <button
              type="button"
              role="tab"
              aria-selected={
                activeFilter === "all"
              }
              onClick={() =>
                setActiveFilter("all")
              }
              className={`rounded-full px-4 py-2 text-xs font-medium transition sm:px-5 ${
                activeFilter === "all"
                  ? "bg-white text-black"
                  : "text-white/40 hover:text-white"
              }`}
            >
              All
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={
                activeFilter === "movie"
              }
              onClick={() =>
                setActiveFilter("movie")
              }
              className={`rounded-full px-4 py-2 text-xs font-medium transition sm:px-5 ${
                activeFilter === "movie"
                  ? "bg-white text-black"
                  : "text-white/40 hover:text-white"
              }`}
            >
              Movies
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={
                activeFilter === "tv"
              }
              onClick={() =>
                setActiveFilter("tv")
              }
              className={`rounded-full px-4 py-2 text-xs font-medium transition sm:px-5 ${
                activeFilter === "tv"
                  ? "bg-white text-black"
                  : "text-white/40 hover:text-white"
              }`}
            >
              TV Shows
            </button>

          </div>

        </div>

        {/* =========================
            FILTERED WATCHLIST
        ========================= */}

        {filteredWatchlist.length > 0 ? (
          <ContentGrid
            items={filteredWatchlist.map(
              (item) => ({
                id: item.contentId,
                type: item.contentType,
                title: item.title,
                image: item.image,
                year: item.year,
                rating: item.rating,
              })
            )}
            showRemoveButton={true}
            onRemove={handleRemove}
          />
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-20 text-center">

            <Bookmark
              size={42}
              className="mx-auto text-white/15"
            />

            <h2 className="mt-5 text-xl font-semibold">
              No {filterLabel} saved
            </h2>

            <p className="mt-2 text-sm text-white/30">
              Add some content to your watchlist to see it here.
            </p>

          </div>
        )}

      </>
    )}

  </div>
</main>


);
};

export default Watchlist;
