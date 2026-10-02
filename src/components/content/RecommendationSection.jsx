
import ContentCard from "./ContentCard";

const RecommendationSection = ({
  title,
  subtitle,
  items = [],
  type = "movie",
}) => {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  const normalizedItems = items
    .filter((item) => item?.id)
    .slice(0, 10)
    .map((item) => {
      const isTV = type === "tv";

      const releaseDate = isTV
        ? item.first_air_date
        : item.release_date;

      return {
        id: item.id,

        title: isTV
          ? item.name || "Untitled"
          : item.title || "Untitled",

        image: item.poster_path
          ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
          : "",

        year: releaseDate
          ? releaseDate.slice(0, 4)
          : "",

        rating:
          typeof item.vote_average === "number" &&
          item.vote_average > 0
            ? item.vote_average.toFixed(1)
            : "",

        type: isTV ? "tv" : "movie",
      };
    });

  if (normalizedItems.length === 0) {
    return null;
  }

  return (
    <section className="mt-20">

      {/* =========================
          SECTION HEADER
      ========================= */}

      <div className="mb-8">

        <p className="text-xs uppercase tracking-[0.2em] text-white/30">
          Discover
        </p>

        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          {title || "Recommendations"}
        </h2>

        {subtitle && (
          <p className="mt-3 max-w-2xl text-sm text-white/40">
            {subtitle}
          </p>
        )}

      </div>

      {/* =========================
          RECOMMENDATION GRID
      ========================= */}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">

        {normalizedItems.map(
          (item, index) => (
            <ContentCard
              key={`${item.type}-${item.id}`}
              content={item}
              index={index}
            />
          )
        )}

      </div>

    </section>
  );
};

export default RecommendationSection;

