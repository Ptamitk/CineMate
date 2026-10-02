
import { Play } from "lucide-react";

const VideoSection = ({ videos = [] }) => {
  const trailers = Array.isArray(videos)
    ? videos
        .filter(
          (video) =>
            video?.id &&
            video?.key &&
            video.site === "YouTube" &&
            (
              video.type === "Trailer" ||
              video.type === "Teaser"
            )
        )
        .filter(
          (video, index, self) =>
            index ===
            self.findIndex(
              (item) =>
                item.key === video.key
            )
        )
        .slice(0, 4)
    : [];

  if (!trailers.length) {
    return null;
  }

  return (
    <section className="mt-20">

      {/* =========================
          SECTION HEADER
      ========================= */}

      <div className="mb-8">

        <p className="text-xs uppercase tracking-[0.2em] text-white/30">
          Watch
        </p>

        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Trailers & Videos
        </h2>

      </div>

      {/* =========================
          VIDEO GRID
      ========================= */}

      <div className="grid gap-6 md:grid-cols-2">

        {trailers.map((video) => {
          const thumbnail = `https://img.youtube.com/vi/${video.key}/maxresdefault.jpg`;

          return (
            <a
              key={`${video.id}-${video.key}`}
              href={`https://www.youtube.com/watch?v=${video.key}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-all duration-500 hover:-translate-y-1 hover:border-white/20"
              aria-label={`Watch ${video.name || "video"} on YouTube`}
            >

              <div className="relative aspect-video overflow-hidden">

                {/* THUMBNAIL */}

                <img
                  src={thumbnail}
                  alt={video.name || "Video thumbnail"}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  onError={(event) => {
                    event.currentTarget.style.display =
                      "none";
                  }}
                />

                {/* OVERLAY */}

                <div className="absolute inset-0 bg-black/35 transition group-hover:bg-black/20" />

                {/* PLAY BUTTON */}

                <div className="absolute inset-0 flex items-center justify-center">

                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-md transition duration-300 group-hover:scale-110 group-hover:bg-white group-hover:text-black">

                    <Play
                      size={24}
                      fill="currentColor"
                    />

                  </div>

                </div>

                {/* TYPE */}

                <span className="absolute bottom-3 left-3 rounded-full border border-white/15 bg-black/70 px-3 py-1 text-xs backdrop-blur-md">
                  {video.type}
                </span>

              </div>

              {/* VIDEO INFO */}

              <div className="p-4">

                <h3 className="line-clamp-2 text-sm font-semibold">
                  {video.name ||
                    "Untitled Video"}
                </h3>

              </div>

            </a>
          );
        })}

      </div>

    </section>
  );
};

export default VideoSection;

