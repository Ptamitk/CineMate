import { useLayoutEffect, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const TrendingMovies = ({ items = [] }) => {
  const sectionRef = useRef(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.innerWidth < 768;

    const ctx = gsap.context(() => {
      if (reduceMotion) return;

      gsap.from(".trending-kicker", {
        y: 20, opacity: 0, duration: 0.6,
        scrollTrigger: { trigger: section, start: "top 84%", toggleActions: "play none none reverse" },
      });

      gsap.from(".trending-title", {
        y: isMobile ? 35 : 60, opacity: 0,
        duration: isMobile ? 0.65 : 0.9, ease: "power4.out",
        scrollTrigger: { trigger: section, start: "top 82%", toggleActions: "play none none reverse" },
      });

      gsap.from(".movie-card", {
        y: isMobile ? 25 : 65,
        opacity: 0,
        scale: isMobile ? 0.98 : 0.94,
        duration: isMobile ? 0.5 : 0.75,
        stagger: isMobile ? 0.05 : 0.08,
        ease: "power3.out",
        scrollTrigger: { trigger: ".movie-grid", start: "top 88%", toggleActions: "play none none reverse" },
      });
    }, section);

    return () => ctx.revert();
  }, [items.length]);

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-black px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
      <div className="pointer-events-none absolute -left-32 top-1/3 h-80 w-80 rounded-full bg-white/[0.035] blur-[120px]" />
      <div className="relative z-10 mx-auto max-w-[1600px]">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="trending-kicker mb-3 text-xs font-medium uppercase tracking-[0.25em] text-white/35">
              What's trending
            </p>
            <h2 className="trending-title text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Trending Movies
            </h2>
          </div>

          <Link
            to="/movies"
            className="hidden rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white/60 transition hover:border-white/25 hover:bg-white/10 hover:text-white sm:block"
          >
            View All →
          </Link>
        </div>

        {items.length ? (
          <div className="movie-grid grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-5">
            {items.slice(0, 10).map((movie) => (
              <Link key={movie.id} to={`/movie/${movie.id}`} className="movie-card group relative block will-change-transform">
                <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                  {movie.image ? (
                    <img
                      src={movie.image}
                      alt={movie.title}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    />
                  ) : (
                    <div className="h-full w-full bg-white/5" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent opacity-75 transition-opacity duration-500 group-hover:opacity-90" />
                  <div className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/60 px-2.5 py-1 text-xs font-semibold backdrop-blur-md">
                    ★ {movie.rating || "—"}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <p className="mb-1 text-[10px] uppercase tracking-wider text-white/50">
                      {movie.year || "Now trending"}
                    </p>
                    <h3 className="line-clamp-2 text-base font-semibold leading-tight sm:text-lg">
                      {movie.title}
                    </h3>
                  </div>
                  <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/0 transition-all duration-500 group-hover:ring-white/30 group-hover:shadow-[0_20px_60px_rgba(255,255,255,0.12)]" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="aspect-[2/3] animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />
            ))}
          </div>
        )}

        <Link
          to="/movies"
          className="mt-8 block w-full rounded-full border border-white/10 bg-white/5 px-5 py-3 text-center text-sm text-white/60 transition hover:bg-white/10 hover:text-white sm:hidden"
        >
          View All Movies →
        </Link>
      </div>
    </section>
  );
};

export default TrendingMovies;
