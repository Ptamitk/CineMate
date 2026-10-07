import { useLayoutEffect, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const PopularMovies = ({ items = [] }) => {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track || !items.length) return undefined;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      if (reduceMotion || window.innerWidth < 768) return;

      const getScrollAmount = () =>
        Math.max(0, track.scrollWidth - window.innerWidth);

      gsap.to(track, {
        x: () => -getScrollAmount(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${Math.max(getScrollAmount(), 1)}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      });

      gsap.from(".popular-title", {
        y: 60,
        opacity: 0,
        duration: 0.9,
        ease: "power4.out",
        scrollTrigger: {
          trigger: section,
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
      });
    }, section);

    return () => ctx.revert();
  }, [items.length]);

  return (
    <section ref={sectionRef} className="relative min-h-[70vh] overflow-hidden bg-black py-16 md:h-screen md:py-0">
      <div className="popular-title absolute left-5 top-10 z-20 sm:left-8 lg:left-12">
        <p className="mb-3 text-xs uppercase tracking-[0.25em] text-white/35">Explore more</p>
        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">Popular Movies</h2>
      </div>

      <div
        ref={trackRef}
        className="flex w-max items-center gap-4 px-5 pt-32 sm:gap-6 sm:px-8 md:h-full md:gap-7 md:pt-20 lg:gap-8 lg:px-12"
      >
        {items.slice(0, 10).map((movie, index) => (
          <Link
            key={movie.id}
            to={`/movie/${movie.id}`}
            className="group relative h-[58vh] w-[250px] shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-white/5 sm:w-[300px] md:h-[65vh] md:w-[320px] lg:w-[380px]"
          >
            {movie.image ? (
              <img
                src={movie.image}
                alt={movie.title}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
              />
            ) : (
              <div className="h-full w-full bg-white/5" />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
            <span className="absolute left-5 top-5 text-5xl font-black text-white/20 transition group-hover:text-white/50">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="absolute right-5 top-5 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-xs font-semibold backdrop-blur-md">
              ★ {movie.rating || "—"}
            </div>
            <div className="absolute inset-x-0 bottom-0 p-6">
              <p className="mb-2 text-xs uppercase tracking-wider text-white/50">{movie.year || "Popular"}</p>
              <h3 className="text-2xl font-bold sm:text-3xl">{movie.title}</h3>
              <div className="mt-4 h-px w-0 bg-white/50 transition-all duration-700 group-hover:w-full" />
            </div>
            <div className="absolute inset-0 rounded-3xl ring-1 ring-white/0 transition-all duration-500 group-hover:ring-white/30 group-hover:shadow-[0_20px_80px_rgba(255,255,255,0.15)]" />
          </Link>
        ))}
      </div>

      <div className="absolute bottom-8 left-5 z-20 text-xs text-white/30 sm:left-8 lg:left-12">
        <Link to="/movies" className="transition hover:text-white">Explore all movies →</Link>
      </div>
    </section>
  );
};

export default PopularMovies;
