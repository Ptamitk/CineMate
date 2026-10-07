import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
Bookmark,
Star,
Trash2,
} from "lucide-react";

import {
isInWatchlist,
toggleWatchlist,
} from "../../utils/watchlist";

const getContentPath = (content) => {
switch (content.type) {
case "movie":
return `/movie/${content.id}`;


case "tv":
  return `/tv/${content.id}`;

case "person":
  return `/person/${content.id}`;

default:
  return "#";


}
};

const ContentCard = ({
content,
index = 0,
showRemoveButton = false,
onRemove,
}) => {
const isPerson = content.type === "person";

const [watchlisted, setWatchlisted] = useState(false);\nconst cardRef = useRef(null);

const detailsPath =
getContentPath(content);

/* =========================
SYNC WATCHLIST STATE
========================= */

useEffect(() => {
if (isPerson) {
return;
}


let mounted = true;

const syncWatchlist = async () => {
  const exists =
    await isInWatchlist(
      content.id,
      content.type
    );

  if (mounted) {
    setWatchlisted(exists);
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


}, [
content.id,
content.type,
isPerson,
]);

/* =========================
WATCHLIST
========================= */

const handleWatchlist = async (event) => {
event.preventDefault();
event.stopPropagation();


if (isPerson) {
  return;
}

try {
  const updatedWatchlist =
    await toggleWatchlist(content);

  const exists =
    updatedWatchlist.some(
      (item) =>
        Number(item?.contentId) ===
          Number(content.id) &&
        item?.contentType ===
          content.type
    );

  setWatchlisted(exists);

  window.dispatchEvent(
    new Event("watchlistUpdated")
  );
} catch (error) {
  console.error(
    "Watchlist Toggle Error:",
    error
  );
}


};

/* =========================
REMOVE
========================= */

const handleRemove = (event) => {
event.preventDefault();
event.stopPropagation();


onRemove?.(
  content.id,
  content.type
);


};

return (
<article
className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-all duration-500 hover:-translate-y-2 hover:border-white/20 hover:shadow-[0_20px_60px_rgba(255,255,255,0.08)] ${
        isPerson
          ? "rounded-[1.5rem]"
          : ""
      }`}
>
{/* =========================
CLICKABLE CONTENT
========================= */}


  <Link
    to={detailsPath}
    className="block"
    aria-label={`Open ${content.title}`}
  >
    <div className="relative aspect-[2/3] overflow-hidden">

      {/* =========================
         IMAGE
      ========================= */}

      {content.image ? (
        <img
          src={content.image}
          alt={content.title}
          className={`h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 ${
            isPerson
              ? "object-top"
              : "object-cover"
          }`}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-white/[0.05] text-sm text-white/30">
          No Image
        </div>
      )}

      {/* =========================
         POSTER OVERLAY
      ========================= */}

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent opacity-80" />\n      <div className="pointer-events-none absolute -inset-1/2 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background: "radial-gradient(circle at var(--mx) var(--my), rgba(255,255,255,0.14), transparent 24%)" }} />

      {/* =========================
         PERSON TOP LABEL
      ========================= */}

      {isPerson && (
        <div className="absolute left-3 top-3 z-10 rounded-full border border-white/15 bg-black/50 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-white/60 backdrop-blur-md">
          Spotlight
        </div>
      )}

      {/* =========================
         NUMBER
      ========================= */}

      {!isPerson && (
        <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/60 text-xs font-semibold backdrop-blur-md">
          {String(index + 1).padStart(
            2,
            "0"
          )}
        </span>
      )}

      {/* =========================
         RATING
      ========================= */}

      {!isPerson &&
        content.rating && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full border border-white/15 bg-black/60 px-2.5 py-1 text-xs font-medium backdrop-blur-md">
            <Star
              size={12}
              fill="currentColor"
            />
            {content.rating}
          </span>
        )}

      {/* =========================
         CONTENT INFO
      ========================= */}

      <div className="absolute inset-x-0 bottom-0 p-4">

        {content.type && (
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">
            {content.type === "tv"
              ? "TV / Web Series"
              : content.type === "movie"
                ? "Movie"
                : "Person"}
          </p>
        )}

        <h3 className="mt-1 line-clamp-1 text-base font-semibold sm:text-lg">
          {content.title}
        </h3>

        {content.year && (
          <p className="mt-1 text-xs text-white/35">
            {content.year}
          </p>
        )}

      </div>

      {/* =========================
         PERSON HOVER GLOW
      ========================= */}

      {isPerson && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/[0.08] via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      )}

    </div>
  </Link>

  {/* =========================
     WATCHLIST BUTTON
  ========================= */}

  {!isPerson && (
    <button
      type="button"
      onClick={handleWatchlist}
      aria-label={
        watchlisted
          ? "Remove from watchlist"
          : "Add to watchlist"
      }
      className={`absolute bottom-16 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-md transition-all duration-300 ${
        watchlisted
          ? "border-white/30 bg-white text-black"
          : "border-white/15 bg-black/60 text-white/70 hover:border-white/30 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Bookmark
        size={16}
        fill={
          watchlisted
            ? "currentColor"
            : "none"
        }
      />
    </button>
  )}

  {/* =========================
     REMOVE BUTTON
  ========================= */}

  {showRemoveButton &&
    !isPerson && (
      <button
        type="button"
        onClick={handleRemove}
        aria-label={`Remove ${content.title} from watchlist`}
        className="absolute bottom-5 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white/70 backdrop-blur-md transition-all duration-300 hover:border-white/30 hover:bg-white hover:text-black"
      >
        <Trash2 size={16} />
      </button>
    )}
</article>


);
};

export default ContentCard;
