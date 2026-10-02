
import { ExternalLink } from "lucide-react";

const IMAGE_BASE =
  "https://image.tmdb.org/t/p/w300";

const WatchProviders = ({ providers }) => {
  const india = providers?.results?.IN;

  if (!india) {
    return null;
  }

  const sections = [
    {
      title: "Stream",
      providers: Array.isArray(india.flatrate)
        ? india.flatrate
        : [],
    },
    {
      title: "Free",
      providers: Array.isArray(india.free)
        ? india.free
        : [],
    },
    {
      title: "Rent",
      providers: Array.isArray(india.rent)
        ? india.rent
        : [],
    },
    {
      title: "Buy",
      providers: Array.isArray(india.buy)
        ? india.buy
        : [],
    },
  ];

  const hasProviders = sections.some(
    (section) =>
      section.providers.length > 0
  );

  if (!hasProviders) {
    return null;
  }

  const watchLink =
    typeof india.link === "string"
      ? india.link
      : "";

  return (
    <section className="mt-20">

      {/* =========================
          SECTION HEADER
      ========================= */}

      <div className="mb-8">

        <p className="text-xs uppercase tracking-[0.2em] text-white/30">
          Availability
        </p>

        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Where to Watch
        </h2>

        <p className="mt-3 text-sm text-white/40">
          Available platforms in India.
        </p>

      </div>

      {/* =========================
          PROVIDER SECTIONS
      ========================= */}

      <div className="space-y-8">

        {sections.map((section) => {
          if (!section.providers.length) {
            return null;
          }

          return (
            <div key={section.title}>

              <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.15em] text-white/40">
                {section.title}
              </h3>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">

                {section.providers
                  .filter(
                    (provider) =>
                      provider?.provider_id
                  )
                  .filter(
                    (provider, index, list) =>
                      index ===
                      list.findIndex(
                        (item) =>
                          item.provider_id ===
                          provider.provider_id
                      )
                  )
                  .map((provider) => {

                    const providerLink =
                      watchLink || "#";

                    return (
                      <a
                        key={`${section.title}-${provider.provider_id}`}
                        href={providerLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.06]"
                      >

                        {/* PROVIDER LOGO */}

                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.05]">

                          {provider.logo_path ? (
                            <img
                              src={`${IMAGE_BASE}${provider.logo_path}`}
                              alt={
                                provider.provider_name ||
                                "Streaming provider"
                              }
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-white/30">
                              TV
                            </div>
                          )}

                        </div>

                        {/* PROVIDER INFO */}

                        <div className="min-w-0 flex-1">

                          <p className="truncate text-sm font-semibold">
                            {provider.provider_name ||
                              "Unknown Provider"}
                          </p>

                          <p className="mt-1 flex items-center gap-1 text-xs text-white/30">
                            Open
                            <ExternalLink
                              size={11}
                            />
                          </p>

                        </div>

                      </a>
                    );
                  })}

              </div>

            </div>
          );
        })}

      </div>

    </section>
  );
};

export default WatchProviders;

