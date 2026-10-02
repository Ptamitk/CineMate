
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  ArrowLeft,
  Calendar,
  MapPin,
  Star,
  User,
} from "lucide-react";

import { contentService } from "../../services/content/contentService";

const PersonDetails = () => {
  const { id } = useParams();

  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchPerson = async () => {
      try {
        setLoading(true);
        setError("");

        const data =
          await contentService.people.details(id);

        if (!isMounted) {
          return;
        }

        setPerson(data);
      } catch (fetchError) {
        if (!isMounted) {
          return;
        }

        console.error(
          "TMDB PERSON DETAILS ERROR:",
          fetchError
        );

        setPerson(null);
        setError(
          "Unable to load person details."
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (id) {
      fetchPerson();
    } else {
      setLoading(false);
      setError("Person ID is missing.");
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

  if (error || !person) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-5 text-white">
        <div className="max-w-md text-center">

          <h1 className="text-3xl font-bold">
            Person not found
          </h1>

          <p className="mt-3 text-white/40">
            {error || "Something went wrong."}
          </p>

          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm text-white/70 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={17} />
            Back Home
          </Link>

        </div>
      </main>
    );
  }

  /* =========================
     PROFILE IMAGE
  ========================= */

  const profileImage = person.profile_path
    ? `https://image.tmdb.org/t/p/h632${person.profile_path}`
    : "";

  /* =========================
     BIRTHDAY
  ========================= */

  const birthday = person.birthday
    ? new Date(
        person.birthday
      ).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  /* =========================
     FILMOGRAPHY
  ========================= */

  const filmography =
    person.combined_credits?.cast
      ?.filter(
        (item) =>
          item.poster_path &&
          (item.media_type === "movie" ||
            item.media_type === "tv")
      )
      ?.sort(
        (a, b) =>
          (b.vote_count || 0) -
          (a.vote_count || 0)
      )
      ?.slice(0, 18) || [];

  return (
    <main className="min-h-screen bg-black text-white">

      {/* =========================
          HERO
      ========================= */}

      <section className="relative overflow-hidden">

        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] via-black to-black" />

        <div className="relative mx-auto max-w-[1600px] px-5 pb-16 pt-32 sm:px-8 lg:px-12 lg:pb-24">

          {/* BACK BUTTON */}

          <Link
            to="/"
            className="mb-10 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-white/55 transition hover:border-white/25 hover:text-white"
          >
            <ArrowLeft size={15} />
            Back Home
          </Link>

          <div className="grid gap-10 lg:grid-cols-[320px_1fr] lg:items-start">

            {/* PROFILE IMAGE */}

            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">

              {profileImage ? (
                <img
                  src={profileImage}
                  alt={person.name || "Person"}
                  className="aspect-[2/3] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[2/3] items-center justify-center">
                  <User
                    size={80}
                    strokeWidth={1}
                    className="text-white/20"
                  />
                </div>
              )}

            </div>

            {/* INFO */}

            <div className="max-w-4xl">

              <p className="text-xs uppercase tracking-[0.25em] text-white/30">
                {person.known_for_department ||
                  "Entertainment"}
              </p>

              <h1 className="mt-4 text-5xl font-bold tracking-[-0.04em] sm:text-6xl lg:text-8xl">
                {person.name || "Unknown Person"}
              </h1>

              {/* ALTERNATE NAMES */}

              {person.also_known_as?.length > 0 && (
                <p className="mt-4 text-sm text-white/35">
                  Also known as:{" "}
                  {person.also_known_as
                    .slice(0, 3)
                    .join(", ")}
                </p>
              )}

              {/* META */}

              <div className="mt-8 flex flex-wrap gap-3">

                {person.birthday && (
                  <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60">
                    <Calendar size={15} />
                    {birthday}
                  </span>
                )}

                {person.place_of_birth && (
                  <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60">
                    <MapPin size={15} />
                    {person.place_of_birth}
                  </span>
                )}

              </div>

              {/* BIOGRAPHY */}

              <div className="mt-10">

                <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                  Biography
                </p>

                <p className="mt-4 max-w-3xl text-sm leading-8 text-white/55 sm:text-base">
                  {person.biography ||
                    "No biography available."}
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* =========================
          KNOWN FOR
      ========================= */}

      {filmography.length > 0 && (
        <section className="mx-auto max-w-[1600px] px-5 pb-24 sm:px-8 lg:px-12">

          <div className="mb-8">

            <p className="text-xs uppercase tracking-[0.2em] text-white/30">
              Filmography
            </p>

            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Known For
            </h2>

          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5 xl:grid-cols-6">

            {filmography.map((item) => {
              const isTV =
                item.media_type === "tv";

              const title =
                item.title ||
                item.name ||
                "Untitled";

              const image =
                `https://image.tmdb.org/t/p/w500${item.poster_path}`;

              const releaseDate =
                item.release_date ||
                item.first_air_date;

              const year = releaseDate
                ? releaseDate.slice(0, 4)
                : "";

              const rating =
                typeof item.vote_average ===
                  "number" &&
                item.vote_average > 0
                  ? item.vote_average.toFixed(1)
                  : "";

              const detailsPath = isTV
                ? `/tv/${item.id}`
                : `/movie/${item.id}`;

              return (
                <Link
                  key={`${item.media_type}-${item.id}`}
                  to={detailsPath}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-all duration-500 hover:-translate-y-2 hover:border-white/20"
                >

                  <div className="relative aspect-[2/3] overflow-hidden">

                    <img
                      src={image}
                      alt={title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    {/* PRESERVED POSTER OVERLAY */}

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent opacity-80" />

                    <div className="absolute inset-x-0 bottom-0 p-4">

                      <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">
                        {isTV
                          ? "TV / Web Series"
                          : "Movie"}
                      </p>

                      <h3 className="mt-1 line-clamp-2 text-sm font-semibold sm:text-base">
                        {title}
                      </h3>

                      {year && (
                        <p className="mt-1 text-xs text-white/35">
                          {year}
                        </p>
                      )}

                      {rating && (
                        <p className="mt-2 flex items-center gap-1 text-xs text-white/45">
                          <Star
                            size={11}
                            fill="currentColor"
                          />
                          {rating}
                        </p>
                      )}

                    </div>

                  </div>

                </Link>
              );
            })}

          </div>

        </section>
      )}

    </main>
  );
};

export default PersonDetails;

