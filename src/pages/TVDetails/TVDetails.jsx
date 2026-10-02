
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  ArrowLeft,
  Calendar,
  Clock,
  Play,
  Star,
  Tv,
} from "lucide-react";

import { contentService } from "../../services/content/contentService";

import CastCrew from "../../components/content/CastCrew";
import VideoSection from "../../components/content/VideoSection";
import WatchProviders from "../../components/content/WatchProviders";
import RecommendationSection from "../../components/content/RecommendationSection";

const TVDetails = () => {
  const { id } = useParams();

  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedSeason, setSelectedSeason] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);

  const [credits, setCredits] = useState(null);
  const [videos, setVideos] = useState([]);
  const [watchProviders, setWatchProviders] = useState(null);

  const [similarTVShows, setSimilarTVShows] = useState([]);
  const [recommendedTVShows, setRecommendedTVShows] = useState([]);

  /* =========================
     LOAD TV SHOW DETAILS
  ========================= */

  useEffect(() => {
    let isMounted = true;

    const fetchShow = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          showData,
          creditsData,
          videosData,
          providersData,
          similarData,
          recommendedData,
        ] = await Promise.all([
          contentService.tv.details(id),
          contentService.tv.credits(id),
          contentService.tv.videos(id),
          contentService.tv.watchProviders(id),
          contentService.tv.similar(id),
          contentService.tv.recommended(id),
        ]);

        if (!isMounted) {
          return;
        }

        setShow(showData);
        setCredits(creditsData);
        setVideos(videosData?.results || []);
        setWatchProviders(providersData);

        setSimilarTVShows(
          similarData?.results || []
        );

        setRecommendedTVShows(
          recommendedData?.results || []
        );
      } catch (fetchError) {
        if (!isMounted) {
          return;
        }

        console.error(
          "TMDB TV DETAILS ERROR:",
          fetchError
        );

        setShow(null);
        setCredits(null);
        setVideos([]);
        setWatchProviders(null);
        setSimilarTVShows([]);
        setRecommendedTVShows([]);

        setError(
          "Unable to load TV show details."
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (id) {
      fetchShow();
    } else {
      setLoading(false);
      setError("TV show ID is missing.");
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  /* =========================
     LOAD SEASON EPISODES
  ========================= */

  const handleSeasonClick = async (seasonNumber) => {
    let isMounted = true;

    try {
      setEpisodesLoading(true);
      setSelectedSeason(seasonNumber);
      setEpisodes([]);

      const data =
        await contentService.tv.seasonDetails(
          id,
          seasonNumber
        );

      if (!isMounted) {
        return;
      }

      setEpisodes(data?.episodes || []);
    } catch (seasonError) {
      if (!isMounted) {
        return;
      }

      console.error(
        "TMDB SEASON ERROR:",
        seasonError
      );

      setEpisodes([]);
    } finally {
      if (isMounted) {
        setEpisodesLoading(false);
      }
    }

    return () => {
      isMounted = false;
    };
  };

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

  if (error || !show) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-5 text-white">
        <div className="max-w-md text-center">

          <h1 className="text-3xl font-bold">
            TV Show not found
          </h1>

          <p className="mt-3 text-white/40">
            {error || "Something went wrong."}
          </p>

          <Link
            to="/tv-shows"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm text-white/70 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={17} />
            Back to TV Shows
          </Link>

        </div>
      </main>
    );
  }

  /* =========================
     MEDIA
  ========================= */

  const poster = show.poster_path
    ? `https://image.tmdb.org/t/p/w780${show.poster_path}`
    : "";

  const backdrop = show.backdrop_path
    ? `https://image.tmdb.org/t/p/original${show.backdrop_path}`
    : "";

  /* =========================
     BASIC META
  ========================= */

  const year = show.first_air_date
    ? show.first_air_date.slice(0, 4)
    : "N/A";

  const rating =
    typeof show.vote_average === "number"
      ? show.vote_average.toFixed(1)
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

        {/* CONTENT */}

        <div className="relative mx-auto flex min-h-[85vh] max-w-[1600px] items-end px-5 pb-16 pt-32 sm:px-8 lg:px-12 lg:pb-24">

          <div className="grid w-full gap-10 lg:grid-cols-[280px_1fr] lg:items-end xl:grid-cols-[320px_1fr]">

            {/* POSTER */}

            <div className="hidden overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-2xl lg:block">

              {poster ? (
                <img
                  src={poster}
                  alt={show.name}
                  className="aspect-[2/3] w-full object-cover"
                />
              ) : (
                <div className="aspect-[2/3] w-full bg-white/[0.04]" />
              )}

            </div>

            {/* INFO */}

            <div className="max-w-4xl">

              <Link
                to="/tv-shows"
                className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs text-white/55 backdrop-blur-md transition hover:border-white/25 hover:text-white"
              >
                <ArrowLeft size={15} />
                Back to TV Shows
              </Link>

              <p className="text-xs uppercase tracking-[0.25em] text-white/40">
                {show.tagline ||
                  "TV Show / Web Series"}
              </p>

              <h1 className="mt-4 text-5xl font-bold tracking-[-0.04em] sm:text-6xl lg:text-8xl">
                {show.name}
              </h1>

              {show.original_name &&
                show.original_name !== show.name && (
                  <p className="mt-3 text-sm text-white/35">
                    Original title: {show.original_name}
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

                {show.number_of_seasons > 0 && (
                  <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60">
                    <Tv size={15} />

                    {show.number_of_seasons}{" "}

                    {show.number_of_seasons === 1
                      ? "Season"
                      : "Seasons"}
                  </span>
                )}

                {show.number_of_episodes > 0 && (
                  <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60">
                    <Clock size={15} />

                    {show.number_of_episodes} Episodes
                  </span>
                )}

              </div>

              {/* GENRES */}

              {show.genres?.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">

                  {show.genres.map((genre) => (
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
                {show.overview ||
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
              {show.status || "N/A"}
            </p>

          </div>

          {/* LANGUAGE */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

            <p className="text-xs uppercase tracking-wider text-white/30">
              Language
            </p>

            <p className="mt-3 text-lg font-semibold uppercase">
              {show.original_language ||
                "N/A"}
            </p>

          </div>

          {/* FIRST AIR DATE */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

            <p className="text-xs uppercase tracking-wider text-white/30">
              First Air Date
            </p>

            <p className="mt-3 text-lg font-semibold">
              {show.first_air_date || "N/A"}
            </p>

          </div>

          {/* LAST AIR DATE */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

            <p className="text-xs uppercase tracking-wider text-white/30">
              Last Air Date
            </p>

            <p className="mt-3 text-lg font-semibold">
              {show.last_air_date || "N/A"}
            </p>

          </div>

        </div>

        {/* =========================
            SEASONS
        ========================= */}

        <section className="mt-20">

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/30">
              Episodes
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Seasons
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/40">
              Explore every season and its episodes.
            </p>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

            {show.seasons?.map((season) => {
              const seasonPoster =
                season.poster_path
                  ? `https://image.tmdb.org/t/p/w500${season.poster_path}`
                  : "";

              const isSelected =
                selectedSeason ===
                season.season_number;

              return (
                <button
                  key={season.id}
                  type="button"
                  onClick={() =>
                    handleSeasonClick(
                      season.season_number
                    )
                  }
                  className={`group overflow-hidden rounded-2xl border bg-white/[0.03] text-left transition-all duration-500 hover:-translate-y-1 ${
                    isSelected
                      ? "border-white/40"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="aspect-[2/3] overflow-hidden bg-white/[0.04]">

                    {seasonPoster ? (
                      <img
                        src={seasonPoster}
                        alt={season.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-white/25">
                        No Poster
                      </div>
                    )}

                  </div>

                  <div className="p-5">

                    <h3 className="text-lg font-semibold">
                      {season.name}
                    </h3>

                    <p className="mt-2 text-sm text-white/40">
                      {season.episode_count || 0} Episodes
                    </p>

                    {season.air_date && (
                      <p className="mt-1 text-xs text-white/25">
                        {season.air_date}
                      </p>
                    )}

                  </div>
                </button>
              );
            })}

          </div>

        </section>

        {/* =========================
            EPISODES
        ========================= */}

        {selectedSeason !== null && (
          <section className="mt-16">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

              <div>

                <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                  Season {selectedSeason}
                </p>

                <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                  Episodes
                </h2>

              </div>

              <span className="text-sm text-white/30">
                {episodes.length} Episodes
              </span>

            </div>

            {episodesLoading ? (
              <div className="mt-8 space-y-3">

                {Array.from({
                  length: 6,
                }).map((_, index) => (
                  <div
                    key={index}
                    className="h-28 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]"
                  />
                ))}

              </div>
            ) : episodes.length > 0 ? (
              <div className="mt-8 space-y-3">

                {episodes.map((episode) => {
                  const stillImage =
                    episode.still_path
                      ? `https://image.tmdb.org/t/p/w780${episode.still_path}`
                      : "";

                  const episodeRating =
                    typeof episode.vote_average ===
                      "number" &&
                    episode.vote_average > 0
                      ? episode.vote_average.toFixed(1)
                      : null;

                  return (
                    <div
                      key={episode.id}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-all duration-300 hover:border-white/20 sm:flex-row"
                    >

                      {/* EPISODE IMAGE */}

                      <div className="relative aspect-video w-full overflow-hidden bg-white/[0.04] sm:w-64 sm:shrink-0">

                        {stillImage ? (
                          <img
                            src={stillImage}
                            alt={episode.name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-white/25">
                            No Image
                          </div>
                        )}

                        <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/70 px-2.5 py-1 text-xs backdrop-blur-md">
                          E{episode.episode_number}
                        </span>

                      </div>

                      {/* EPISODE INFO */}

                      <div className="flex flex-1 flex-col justify-center p-5">

                        <div className="flex flex-wrap items-center gap-3">

                          <h3 className="text-lg font-semibold">
                            {episode.name}
                          </h3>

                          {episodeRating && (
                            <span className="text-xs text-white/40">
                              ★ {episodeRating}
                            </span>
                          )}

                        </div>

                        <p className="mt-2 text-xs text-white/30">

                          Episode{" "}
                          {episode.episode_number}

                          {episode.air_date
                            ? ` • ${episode.air_date}`
                            : ""}

                          {episode.runtime
                            ? ` • ${episode.runtime} min`
                            : ""}

                        </p>

                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/40">
                          {episode.overview ||
                            "No episode overview available."}
                        </p>

                      </div>

                    </div>
                  );
                })}

              </div>
            ) : (
              <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-white/30">
                No episodes available for this season.
              </div>
            )}

          </section>
        )}

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
            SIMILAR TV SHOWS
        ========================= */}

        <RecommendationSection
          title="Similar TV Shows"
          subtitle="TV shows and web series similar to what you're watching."
          items={similarTVShows}
          type="tv"
        />

        {/* =========================
            RECOMMENDED TV SHOWS
        ========================= */}

        <RecommendationSection
          title="Recommended for You"
          subtitle="More TV shows and web series you might enjoy."
          items={recommendedTVShows}
          type="tv"
        />

      </section>

    </main>
  );
};

export default TVDetails;

