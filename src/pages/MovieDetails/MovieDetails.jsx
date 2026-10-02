
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  ArrowLeft,
  Calendar,
  Clock,
  Play,
  Star,
} from "lucide-react";

import VideoSection from "../../components/content/VideoSection";
import CastCrew from "../../components/content/CastCrew";
import WatchProviders from "../../components/content/WatchProviders";
import RecommendationSection from "../../components/content/RecommendationSection";

import { contentService } from "../../services/content/contentService";

const MovieDetails = () => {
  const { id } = useParams();

  const [movie, setMovie] = useState(null);
  const [credits, setCredits] = useState(null);
  const [videos, setVideos] = useState([]);
  const [watchProviders, setWatchProviders] = useState(null);

  const [similarMovies, setSimilarMovies] = useState([]);
  const [recommendedMovies, setRecommendedMovies] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =========================
     LOAD MOVIE DETAILS
  ========================= */

  useEffect(() => {
    let isMounted = true;

    const fetchMovieDetails = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          movieData,
          creditsData,
          videosData,
          providersData,
          similarData,
          recommendedData,
        ] = await Promise.all([
          contentService.movies.details(id),
          contentService.movies.credits(id),
          contentService.movies.videos(id),
          contentService.movies.watchProviders(id),
          contentService.movies.similar(id),
          contentService.movies.recommended(id),
        ]);

        if (!isMounted) {
          return;
        }

        setMovie(movieData);
        setCredits(creditsData);
        setVideos(videosData?.results || []);
        setWatchProviders(providersData);

        setSimilarMovies(
          similarData?.results || []
        );

        setRecommendedMovies(
          recommendedData?.results || []
        );
      } catch (fetchError) {
        if (!isMounted) {
          return;
        }

        console.error(
          "TMDB MOVIE DETAILS ERROR:",
          fetchError
        );

        setMovie(null);
        setCredits(null);
        setVideos([]);
        setWatchProviders(null);
        setSimilarMovies([]);
        setRecommendedMovies([]);

        setError(
          "Unable to load movie details."
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (id) {
      fetchMovieDetails();
    } else {
      setLoading(false);
      setError("Movie ID is missing.");
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  /* =========================
     LOADING STATE
  ========================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-black px-5 pb-20 pt-32 text-white sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1600px]">
          <div className="h-[70vh] animate-pulse rounded-3xl bg-white/[0.05]" />
        </div>
      </main>
    );
  }

  /* =========================
     ERROR STATE
  ========================= */

  if (error || !movie) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-5 text-white">
        <div className="max-w-md text-center">

          <h1 className="text-3xl font-bold">
            Movie not found
          </h1>

          <p className="mt-3 text-white/40">
            {error || "Something went wrong."}
          </p>

          <Link
            to="/movies"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm text-white/70 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={17} />
            Back to Movies
          </Link>

        </div>
      </main>
    );
  }

  /* =========================
     MEDIA
  ========================= */

  const poster = movie.poster_path
    ? `https://image.tmdb.org/t/p/w780${movie.poster_path}`
    : "";

  const backdrop = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
    : "";

  /* =========================
     BASIC META
  ========================= */

  const year = movie.release_date
    ? movie.release_date.slice(0, 4)
    : "N/A";

  const rating =
    typeof movie.vote_average === "number"
      ? movie.vote_average.toFixed(1)
      : "N/A";

  /* =========================
     TRAILER
  ========================= */

  const trailer =
    videos.find(
      (video) =>
        video.site === "YouTube" &&
        video.type === "Trailer"
    ) ||
    videos.find(
      (video) =>
        video.site === "YouTube" &&
        video.type === "Teaser"
    );

  /* =========================
     WATCH PROVIDERS
  ========================= */

  const indiaProviders =
    watchProviders?.results?.IN;

  const watchOnProviders = indiaProviders
    ? [
        ...(indiaProviders.flatrate || []),
        ...(indiaProviders.free || []),
        ...(indiaProviders.rent || []),
        ...(indiaProviders.buy || []),
      ]
        .filter(
          (provider, index, self) =>
            index ===
            self.findIndex(
              (item) =>
                item.provider_id ===
                provider.provider_id
            )
        )
        .slice(0, 3)
    : [];

  const providerLink =
    indiaProviders?.link || "#";

  return (
    <main className="min-h-screen bg-black text-white">

      {/* =========================
          HERO
      ========================= */}

      <section className="relative min-h-[85vh] overflow-hidden">

        {/* BACKDROP */}

        {backdrop && (
          <img
            src={backdrop}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-35"
          />
        )}

        {/* CINEMATIC OVERLAYS */}

        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/30" />

        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />

        {/* HERO CONTENT */}

        <div className="relative mx-auto flex min-h-[85vh] max-w-[1600px] items-end px-5 pb-16 pt-32 sm:px-8 lg:px-12 lg:pb-24">

          <div className="grid w-full gap-10 lg:grid-cols-[280px_1fr] lg:items-end xl:grid-cols-[320px_1fr]">

            {/* POSTER */}

            <div className="hidden overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-2xl lg:block">

              {poster ? (
                <img
                  src={poster}
                  alt={movie.title}
                  className="aspect-[2/3] w-full object-cover"
                />
              ) : (
                <div className="aspect-[2/3] w-full bg-white/[0.04]" />
              )}

            </div>

            {/* INFO */}

            <div className="max-w-4xl">

              {/* BACK */}

              <Link
                to="/movies"
                className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs text-white/55 backdrop-blur-md transition hover:border-white/25 hover:text-white"
              >
                <ArrowLeft size={15} />
                Back to Movies
              </Link>

              {/* TAGLINE */}

              <p className="text-xs uppercase tracking-[0.25em] text-white/40">
                {movie.tagline || "Movie Details"}
              </p>

              {/* TITLE */}

              <h1 className="mt-4 text-5xl font-bold tracking-[-0.04em] sm:text-6xl lg:text-8xl">
                {movie.title}
              </h1>

              {/* ORIGINAL TITLE */}

              {movie.original_title &&
                movie.original_title !== movie.title && (
                  <p className="mt-3 text-sm text-white/35">
                    Original title: {movie.original_title}
                  </p>
                )}

              {/* META */}

              <div className="mt-7 flex flex-wrap items-center gap-3">

                <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
                  <Star
                    size={15}
                    fill="currentColor"
                  />
                  {rating}
                </span>

                <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60">
                  <Calendar size={15} />
                  {year}
                </span>

                {movie.runtime && (
                  <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60">
                    <Clock size={15} />
                    {movie.runtime} min
                  </span>
                )}

              </div>

              {/* GENRES */}

              {movie.genres?.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">

                  {movie.genres.map((genre) => (
                    <span
                      key={genre.id}
                      className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/45"
                    >
                      {genre.name}
                    </span>
                  ))}

                </div>
              )}

              {/* OVERVIEW */}

              <p className="mt-7 max-w-3xl text-sm leading-7 text-white/55 sm:text-base sm:leading-8">
                {movie.overview ||
                  "No overview available."}
              </p>

              {/* ACTION BUTTONS */}

              <div className="mt-8 flex flex-wrap items-center gap-3">

                {/* WATCH TRAILER */}

                {trailer && (
                  <a
                    href={`https://www.youtube.com/watch?v=${trailer.key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition-all duration-300 hover:scale-105 hover:bg-white/90"
                  >
                    <Play
                      size={18}
                      fill="currentColor"
                    />

                    Watch Trailer
                  </a>
                )}

                {/* WATCH ON PLATFORMS */}

                {watchOnProviders.map(
                  (provider) => (
                    <a
                      key={provider.provider_id}
                      href={providerLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.06] px-4 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-white/30 hover:bg-white/10"
                    >
                      <span>
                        Watch on
                      </span>

                      {provider.logo_path && (
                        <img
                          src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                          alt={provider.provider_name}
                          className="h-7 w-7 rounded-lg object-cover"
                        />
                      )}

                      <span className="max-w-[110px] truncate">
                        {provider.provider_name}
                      </span>
                    </a>
                  )
                )}

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* =========================
          BASIC INFO
      ========================= */}

      <section className="mx-auto max-w-[1600px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          {/* STATUS */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

            <p className="text-xs uppercase tracking-wider text-white/30">
              Status
            </p>

            <p className="mt-3 text-lg font-semibold">
              {movie.status || "N/A"}
            </p>

          </div>

          {/* LANGUAGE */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

            <p className="text-xs uppercase tracking-wider text-white/30">
              Language
            </p>

            <p className="mt-3 text-lg font-semibold uppercase">
              {movie.original_language || "N/A"}
            </p>

          </div>

          {/* BUDGET */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

            <p className="text-xs uppercase tracking-wider text-white/30">
              Budget
            </p>

            <p className="mt-3 text-lg font-semibold">
              {movie.budget
                ? `$${movie.budget.toLocaleString()}`
                : "N/A"}
            </p>

          </div>

          {/* REVENUE */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

            <p className="text-xs uppercase tracking-wider text-white/30">
              Revenue
            </p>

            <p className="mt-3 text-lg font-semibold">
              {movie.revenue
                ? `$${movie.revenue.toLocaleString()}`
                : "N/A"}
            </p>

          </div>

        </div>

        {/* =========================
            CAST & CREW
        ========================= */}

        <CastCrew credits={credits} />

        {/* =========================
            TRAILERS & VIDEOS
        ========================= */}

        <VideoSection videos={videos} />

        {/* =========================
            WHERE TO WATCH
        ========================= */}

        <WatchProviders
          providers={watchProviders}
        />

        {/* =========================
            SIMILAR MOVIES
        ========================= */}

        <RecommendationSection
          title="Similar Movies"
          subtitle="Movies similar to what you're watching."
          items={similarMovies}
          type="movie"
        />

        {/* =========================
            RECOMMENDED MOVIES
        ========================= */}

        <RecommendationSection
          title="Recommended for You"
          subtitle="More movies you might enjoy."
          items={recommendedMovies}
          type="movie"
        />

      </section>

    </main>
  );
};

export default MovieDetails;

