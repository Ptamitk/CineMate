
import { Link } from "react-router-dom";

const MOVIE_GENRES = [
  {
    id: 28,
    name: "Action",
    description: "Adrenaline, battles and unforgettable heroes.",
  },
  {
    id: 12,
    name: "Adventure",
    description: "Epic journeys and worlds waiting to be explored.",
  },
  {
    id: 35,
    name: "Comedy",
    description: "Light-hearted stories made to make you smile.",
  },
  {
    id: 18,
    name: "Drama",
    description: "Emotional stories with unforgettable characters.",
  },
  {
    id: 27,
    name: "Horror",
    description: "Dark stories that keep you on the edge.",
  },
  {
    id: 878,
    name: "Sci-Fi",
    description: "Futuristic worlds, technology and imagination.",
  },
  {
    id: 53,
    name: "Thriller",
    description: "Mystery, tension and stories full of surprises.",
  },
  {
    id: 10749,
    name: "Romance",
    description: "Stories about love, relationships and connection.",
  },
];

const GenreSection = () => {
  return (
    <section className="border-t border-white/10 px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
      <div className="mx-auto max-w-[1600px]">

        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.2em] text-white/30">
            Discover
          </p>

          <h2 className="mt-4 text-4xl font-bold tracking-[-0.04em] sm:text-5xl lg:text-6xl">
            Find your
            <span className="text-white/30">
              {" "}genre.
            </span>
          </h2>

          <p className="mt-5 max-w-2xl text-sm leading-7 text-white/40 sm:text-base">
            Explore CineMate by genre and discover
            movies that match your mood.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MOVIE_GENRES.map((genre, index) => (
            <Link
              key={genre.id}
              to={`/search?genre=${genre.id}&type=movie`}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-all duration-500 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.06]"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="text-xs text-white/20">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <span className="text-white/20 transition-all duration-300 group-hover:translate-x-1 group-hover:text-white/70">
                  ↗
                </span>
              </div>

              <h3 className="mt-10 text-xl font-semibold tracking-tight">
                {genre.name}
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/35 transition-colors duration-300 group-hover:text-white/50">
                {genre.description}
              </p>

              <div className="mt-8 h-px w-10 bg-white/20 transition-all duration-500 group-hover:w-full group-hover:bg-white/50" />
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
};

export default GenreSection;

