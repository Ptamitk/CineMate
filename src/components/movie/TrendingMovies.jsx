
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const movies = [
  {
    id: 1,
    title: "Interstellar",
    year: "2014",
    genre: "Sci-Fi",
    rating: "8.7",
    image:
      "https://image.tmdb.org/t/p/w780/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
  },
  {
    id: 2,
    title: "Inception",
    year: "2010",
    genre: "Thriller",
    rating: "8.8",
    image:
      "https://image.tmdb.org/t/p/w780/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
  },
  {
    id: 3,
    title: "The Dark Knight",
    year: "2008",
    genre: "Action",
    rating: "9.0",
    image:
      "https://image.tmdb.org/t/p/w780/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
  },
  {
    id: 4,
    title: "Dune",
    year: "2021",
    genre: "Sci-Fi",
    rating: "8.0",
    image:
      "https://image.tmdb.org/t/p/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
  },
  {
    id: 5,
    title: "Avatar",
    year: "2009",
    genre: "Adventure",
    rating: "7.9",
    image:
      "https://image.tmdb.org/t/p/w780/kyeqWdyUXW608qlYkRqosgbbJyK.jpg",
  },
];

const TrendingMovies = () => {
  const sectionRef = useRef(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;

    if (!section) {
      return undefined;
    }

    const ctx = gsap.context(() => {
      const isMobile = window.innerWidth < 768;

      /* =========================
         SECTION INTRO
      ========================= */

      gsap.from(".trending-kicker", {
        y: 25,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 82%",
          toggleActions: "play none none reverse",
        },
      });

      gsap.from(".trending-title", {
        y: isMobile ? 50 : 80,
        opacity: 0,
        filter: "blur(12px)",
        duration: 1,
        ease: "power4.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
      });

      gsap.from(".trending-view-all", {
        x: 30,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 78%",
          toggleActions: "play none none reverse",
        },
      });

      /* =========================
         MOVIE CARDS
      ========================= */

      gsap.from(".movie-card", {
        y: isMobile ? 50 : 100,
        opacity: 0,
        scale: isMobile ? 0.96 : 0.88,
        rotateX: isMobile ? 0 : 8,
        filter: isMobile ? "blur(3px)" : "blur(10px)",
        duration: isMobile ? 0.7 : 1,
        stagger: isMobile ? 0.08 : 0.14,
        ease: "power4.out",
        transformOrigin: "center bottom",
        scrollTrigger: {
          trigger: ".movie-grid",
          start: "top 88%",
          toggleActions: "play none none reverse",
        },
      });

      /* =========================
         CINEMATIC BACKGROUND LIGHT
      ========================= */

      gsap.to(".trending-light", {
        x: isMobile ? 80 : 220,
        y: isMobile ? 20 : -40,
        scale: 1.3,
        opacity: 0.8,
        duration: 7,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      /* =========================
         CARD HOVER DEPTH
      ========================= */

      if (!isMobile) {
        const cards =
          gsap.utils.toArray(".movie-card");

        cards.forEach((card) => {
          const poster =
            card.querySelector(".movie-poster");

          const handleEnter = () => {
            gsap.to(card, {
              y: -10,
              scale: 1.025,
              duration: 0.45,
              ease: "power3.out",
              overwrite: "auto",
            });

            gsap.to(poster, {
              scale: 1.06,
              duration: 0.7,
              ease: "power3.out",
              overwrite: "auto",
            });
          };

          const handleLeave = () => {
            gsap.to(card, {
              y: 0,
              scale: 1,
              duration: 0.5,
              ease: "power3.out",
              overwrite: "auto",
            });

            gsap.to(poster, {
              scale: 1,
              duration: 0.7,
              ease: "power3.out",
              overwrite: "auto",
            });
          };

          card.addEventListener(
            "mouseenter",
            handleEnter
          );

          card.addEventListener(
            "mouseleave",
            handleLeave
          );

          card._cleanupTrendingHover = () => {
            card.removeEventListener(
              "mouseenter",
              handleEnter
            );

            card.removeEventListener(
              "mouseleave",
              handleLeave
            );
          };
        });
      }
    }, section);

    return () => {
      const cards =
        section.querySelectorAll(
          ".movie-card"
        );

      cards?.forEach((card) => {
        card._cleanupTrendingHover?.();
        delete card._cleanupTrendingHover;
      });

      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-black px-5 py-24 sm:px-8 lg:px-12 lg:py-32"
    >
      {/* Cinematic background light */}

      <div className="trending-light pointer-events-none absolute -left-32 top-1/3 h-80 w-80 rounded-full bg-white/[0.035] blur-[120px]" />

      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-white/[0.025] blur-[140px]" />

      <div className="relative z-10 mx-auto max-w-[1600px]">

        {/* Header */}

        <div className="mb-10 flex items-end justify-between gap-6">

          <div>
            <p className="trending-kicker mb-3 text-xs font-medium uppercase tracking-[0.25em] text-white/35">
              What's trending
            </p>

            <h2 className="trending-title text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Trending Movies
            </h2>
          </div>

          <button
            type="button"
            className="trending-view-all hidden rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white/60 transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/10 hover:text-white hover:shadow-[0_15px_40px_rgba(255,255,255,0.08)] sm:block"
          >
            View All →
          </button>
        </div>

        {/* Movies */}

        <div className="movie-grid grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-5">
          {movies.map((movie) => (
            <article
              key={movie.id}
              className="movie-card group relative cursor-pointer will-change-transform"
            >
              {/* Poster */}

              <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-white/5">

                <img
                  src={movie.image}
                  alt={movie.title}
                  className="movie-poster h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />

                {/* Dark overlay */}

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-90" />

                {/* Cinematic shine */}

                <div className="pointer-events-none absolute inset-y-0 -left-full w-1/2 skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent transition-all duration-1000 group-hover:left-[130%]" />

                {/* Rating */}

                <div className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/60 px-2.5 py-1 text-xs font-semibold backdrop-blur-md transition-transform duration-300 group-hover:scale-105">
                  ★ {movie.rating}
                </div>

                {/* Bottom info */}

                <div className="absolute inset-x-0 bottom-0 p-4">

                  <p className="mb-1 text-[10px] uppercase tracking-wider text-white/50">
                    {movie.genre} · {movie.year}
                  </p>

                  <h3 className="text-base font-semibold leading-tight sm:text-lg">
                    {movie.title}
                  </h3>

                </div>

                {/* Hover glow */}

                <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/0 transition-all duration-500 group-hover:ring-white/30 group-hover:shadow-[0_20px_60px_rgba(255,255,255,0.12)]" />

              </div>
            </article>
          ))}
        </div>

        {/* Mobile View All */}

        <button
          type="button"
          className="mt-8 w-full rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/60 transition-all duration-300 hover:bg-white/10 hover:text-white sm:hidden"
        >
          View All Movies →
        </button>

      </div>
    </section>
  );
};

export default TrendingMovies;

