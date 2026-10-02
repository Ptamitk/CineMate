import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const movies = [
  {
    id: 1,
    title: "Oppenheimer",
    year: "2023",
    genre: "Drama",
    rating: "8.6",
    image:
      "https://image.tmdb.org/t/p/w780/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
  },
  {
    id: 2,
    title: "John Wick",
    year: "2014",
    genre: "Action",
    rating: "7.4",
    image:
      "https://image.tmdb.org/t/p/w780/fZPSd91yGE9fCcCe6OoQr6E3Bev.jpg",
  },
  {
    id: 3,
    title: "Spider-Man",
    year: "2021",
    genre: "Action",
    rating: "8.2",
    image:
      "https://image.tmdb.org/t/p/w780/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg",
  },
  {
    id: 4,
    title: "The Batman",
    year: "2022",
    genre: "Crime",
    rating: "7.8",
    image:
      "https://image.tmdb.org/t/p/w780/74xTEgt7R36Fpooo50r9T25onhq.jpg",
  },
  {
    id: 5,
    title: "Gladiator",
    year: "2000",
    genre: "History",
    rating: "8.5",
    image:
      "https://image.tmdb.org/t/p/w780/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg",
  },
  {
    id: 6,
    title: "The Matrix",
    year: "1999",
    genre: "Sci-Fi",
    rating: "8.7",
    image:
      "https://image.tmdb.org/t/p/w780/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
  },
];

const PopularMovies = () => {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const track = trackRef.current;

      const getScrollAmount = () => {
        return track.scrollWidth - window.innerWidth;
      };

      gsap.to(track, {
        x: () => -getScrollAmount(),
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: () => `+=${getScrollAmount()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });

      gsap.from(".popular-title", {
        y: 80,
        opacity: 0,
        duration: 1,
        ease: "power4.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative h-screen overflow-hidden bg-black"
    >
      {/* Heading */}
      <div className="popular-title absolute left-5 top-12 z-20 sm:left-8 lg:left-12">
        <p className="mb-3 text-xs uppercase tracking-[0.25em] text-white/35">
          Explore more
        </p>

        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Popular Movies
        </h2>
      </div>

      {/* Horizontal Track */}
      <div
        ref={trackRef}
        className="flex h-full w-max items-center gap-5 px-5 pt-20 sm:gap-7 sm:px-8 lg:gap-8 lg:px-12"
      >
        {movies.map((movie) => (
          <article
            key={movie.id}
            className="group relative h-[65vh] w-[260px] shrink-0 cursor-pointer overflow-hidden rounded-3xl border border-white/10 bg-white/5 sm:w-[320px] lg:w-[380px]"
          >
            {/* Poster */}
            <img
              src={movie.image}
              alt={movie.title}
              className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />

            {/* Number */}
            <span className="absolute left-5 top-5 text-5xl font-black text-white/20 transition-all duration-500 group-hover:text-white/50">
              0{movie.id}
            </span>

            {/* Rating */}
            <div className="absolute right-5 top-5 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-xs font-semibold backdrop-blur-md">
              ★ {movie.rating}
            </div>

            {/* Info */}
            <div className="absolute inset-x-0 bottom-0 p-6">
              <p className="mb-2 text-xs uppercase tracking-wider text-white/50">
                {movie.genre} · {movie.year}
              </p>

              <h3 className="text-2xl font-bold sm:text-3xl">
                {movie.title}
              </h3>

              <div className="mt-4 h-px w-0 bg-white/50 transition-all duration-700 group-hover:w-full" />
            </div>

            {/* Border glow */}
            <div className="absolute inset-0 rounded-3xl ring-1 ring-white/0 transition-all duration-500 group-hover:ring-white/30 group-hover:shadow-[0_20px_80px_rgba(255,255,255,0.15)]" />
          </article>
        ))}
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-5 z-20 flex items-center gap-3 text-xs text-white/30 sm:left-8 lg:left-12">
        <span className="h-px w-10 bg-white/20" />
        Scroll to explore
      </div>
    </section>
  );
};

export default PopularMovies;