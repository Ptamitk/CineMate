
import { Link } from "react-router-dom";

const IMAGE_BASE =
  "https://image.tmdb.org/t/p/w500";

const CastCrew = ({ credits }) => {
  if (!credits) {
    return null;
  }

  const cast = Array.isArray(credits.cast)
    ? credits.cast
    : [];

  const crew = Array.isArray(credits.crew)
    ? credits.crew
    : [];

  /* =========================
     DIRECTORS
  ========================= */

  const directors = crew.filter(
    (person) =>
      person?.id &&
      person.job === "Director"
  );

  /* =========================
     WRITERS
  ========================= */

  const writers = crew.filter(
    (person) =>
      person?.id &&
      (
        person.department === "Writing" ||
        person.job === "Writer" ||
        person.job === "Screenplay" ||
        person.job === "Story"
      )
  );

  /* =========================
     MAIN CAST
  ========================= */

  const mainCast = cast
    .filter((person) => person?.id)
    .slice(0, 12);

  return (
    <section className="mt-20">

      {/* =========================
          CAST
      ========================= */}

      {mainCast.length > 0 && (
        <div>

          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.2em] text-white/30">
              Cast
            </p>

            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Top Cast
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">

            {mainCast.map((person) => {
              const image =
                person.profile_path
                  ? `${IMAGE_BASE}${person.profile_path}`
                  : "";

              return (
                <Link
                  key={
                    person.credit_id ||
                    `${person.id}-${person.order}`
                  }
                  to={`/person/${person.id}`}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-all duration-500 hover:-translate-y-1 hover:border-white/20"
                >

                  <div className="aspect-[2/3] overflow-hidden bg-white/[0.04]">

                    {image ? (
                      <img
                        src={image}
                        alt={
                          person.name ||
                          "Cast member"
                        }
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-white/25">
                        No Image
                      </div>
                    )}

                  </div>

                  <div className="p-3">

                    <h3 className="line-clamp-1 text-sm font-semibold">
                      {person.name ||
                        "Unknown"}
                    </h3>

                    <p className="mt-1 line-clamp-2 text-xs text-white/35">
                      {person.character ||
                        "Cast"}
                    </p>

                  </div>

                </Link>
              );
            })}

          </div>

        </div>
      )}

      {/* =========================
          CREW
      ========================= */}

      {(directors.length > 0 ||
        writers.length > 0) && (
        <div className="mt-16">

          <div className="mb-8">

            <p className="text-xs uppercase tracking-[0.2em] text-white/30">
              Behind the Scenes
            </p>

            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Crew
            </h2>

          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

            {/* =========================
                DIRECTORS
            ========================= */}

            {directors.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

                <p className="text-xs uppercase tracking-[0.15em] text-white/30">
                  Director
                </p>

                <div className="mt-4 space-y-3">

                  {directors
                    .slice(0, 5)
                    .map((person, index) => (
                      <Link
                        key={`${person.id}-${person.job}-${index}`}
                        to={`/person/${person.id}`}
                        className="flex items-center gap-3 transition hover:text-white"
                      >

                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/[0.05]">

                          {person.profile_path ? (
                            <img
                              src={`${IMAGE_BASE}${person.profile_path}`}
                              alt={
                                person.name ||
                                "Director"
                              }
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[10px] text-white/30">
                              N/A
                            </div>
                          )}

                        </div>

                        <div className="min-w-0">

                          <p className="truncate text-sm font-medium">
                            {person.name ||
                              "Unknown"}
                          </p>

                          <p className="text-xs text-white/30">
                            {person.job ||
                              "Director"}
                          </p>

                        </div>

                      </Link>
                    ))}

                </div>

              </div>
            )}

            {/* =========================
                WRITERS
            ========================= */}

            {writers.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

                <p className="text-xs uppercase tracking-[0.15em] text-white/30">
                  Writing
                </p>

                <div className="mt-4 space-y-3">

                  {writers
                    .slice(0, 8)
                    .map((person, index) => (
                      <Link
                        key={`${person.id}-${person.job}-${index}`}
                        to={`/person/${person.id}`}
                        className="flex items-center gap-3 transition hover:text-white"
                      >

                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/[0.05]">

                          {person.profile_path ? (
                            <img
                              src={`${IMAGE_BASE}${person.profile_path}`}
                              alt={
                                person.name ||
                                "Writer"
                              }
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[10px] text-white/30">
                              N/A
                            </div>
                          )}

                        </div>

                        <div className="min-w-0">

                          <p className="truncate text-sm font-medium">
                            {person.name ||
                              "Unknown"}
                          </p>

                          <p className="text-xs text-white/30">
                            {person.job ||
                              "Writer"}
                          </p>

                        </div>

                      </Link>
                    ))}

                </div>

              </div>
            )}

          </div>

        </div>
      )}

    </section>
  );
};

export default CastCrew;

