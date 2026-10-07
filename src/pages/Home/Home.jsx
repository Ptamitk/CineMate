
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { contentService } from "../../services/content/contentService";

import TrendingMovies from "../../components/movie/TrendingMovies";
import PopularMovies from "../../components/movie/PopularMovies";
import SocialPreview from "../../components/social/SocialPreview";
import Footer from "../../components/common/Footer";
import InstagramSceneFinder from "../../components/social/InstagramSceneFinder";
import GenreSection from "../../components/content/GenreSection";
import TrendingTVSection from "../../components/tv/TrendingTVSection";
import PopularTVSection from "../../components/tv/PopularTVSection";
import UpcomingMoviesSection from "../../components/movie/UpcomingMoviesSection";
import PeopleSpotlightSection from "../../components/people/PeopleSpotlightSection";

gsap.registerPlugin(ScrollTrigger);

const Home = () => {
  const heroRef = useRef(null);

  const [trendingMovies, setTrendingMovies] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [trendingTV, setTrendingTV] = useState([]);
  const [popularTV, setPopularTV] = useState([]);
  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [popularPeople, setPopularPeople] = useState([]);

  useEffect(() => {
    const fetchDiscoveryData = async () => {
      try {
        const [
          trendingMoviesData,
          popularMoviesData,
          trendingTVData,
          popularTVData,
          upcomingMoviesData,
          popularPeopleData,
        ] = await Promise.all([
          contentService.movies.trending(),
          contentService.movies.popular(),
          contentService.tv.trending(),
          contentService.tv.popular(),
          contentService.movies.upcoming(),
          contentService.people.popular(),
        ]);

        setTrendingMovies(trendingMoviesData.results || []);
        setPopularMovies(popularMoviesData.results || []);
        setTrendingTV(trendingTVData.results || []);
        setPopularTV(popularTVData.results || []);
        setUpcomingMovies(upcomingMoviesData.results || []);
        setPopularPeople(
          popularPeopleData.results || []
        );
      } catch (error) {
        console.error("Home Discovery Error:", error);
      }
    };

    fetchDiscoveryData();
  }, []);

  /* =========================
     HERO ANIMATIONS
  ========================= */

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const intro = gsap.timeline({
        defaults: {
          ease: "power4.out",
        },
      });

      intro
        .from(".hero-badge", {
          y: 35,
          opacity: 0,
          duration: 0.8,
        })
        .from(
          ".hero-title-line",
          {
            y: 90,
            opacity: 0,
            duration: 1,
            stagger: 0.15,
          },
          "-=0.45"
        )
        .from(
          ".hero-description",
          {
            y: 25,
            opacity: 0,
            duration: 0.8,
          },
          "-=0.5"
        )
        .from(
          ".hero-buttons",
          {
            y: 25,
            opacity: 0,
            scale: 0.96,
            duration: 0.7,
          },
          "-=0.5"
        );

      /* =========================
         FLOATING HERO GLOW
      ========================= */

      gsap.to(".hero-glow", {
        scale: 1.25,
        opacity: 0.7,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      /* =========================
         HERO SCROLL DEPTH
      ========================= */

      gsap.to(".hero-content", {
        y: -120,
        opacity: 0.2,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1.2,
        },
      });

      gsap.to(".hero-glow", {
        y: 140,
        scale: 1.8,
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1.5,
        },
      });

      /* =========================
         DESKTOP MOUSE PARALLAX
      ========================= */

      const handleMouseMove = (event) => {
        if (window.innerWidth < 1024) {
          return;
        }

        const { innerWidth, innerHeight } = window;

        const x =
          (event.clientX / innerWidth - 0.5) * 2;

        const y =
          (event.clientY / innerHeight - 0.5) * 2;

        gsap.to(".hero-glow", {
          x: x * 35,
          y: y * 25,
          duration: 1.2,
          ease: "power3.out",
          overwrite: "auto",
        });

        gsap.to(".hero-content", {
          x: x * 8,
          y: y * 5,
          duration: 1.2,
          ease: "power3.out",
          overwrite: "auto",
        });
      };

      window.addEventListener(
        "mousemove",
        handleMouseMove
      );

      return () => {
        window.removeEventListener(
          "mousemove",
          handleMouseMove
        );
      };
    }, heroRef);

    return () => {
      ctx.revert();
    };
  }, []);

  const trendingMovieItems = normalizeMovies(trendingMovies);
  const popularMovieItems = normalizeMovies(popularMovies);
  const trendingTVItems = normalizeTV(trendingTV);
  const popularTVItems = normalizeTV(popularTV);
  const upcomingMovieItems = normalizeMovies(upcomingMovies);
  const popularPeopleItems = normalizePeople(popularPeople);

  const featuredMovie =
    trendingMovies.find((movie) => movie.backdrop_path) ||
    trendingMovies[0];

  return (
    <main className="min-h-screen bg-black text-white">

      {/* ================= HERO ================= */}

      <section
        ref={heroRef}
        className="relative flex min-h-[calc(100vh-5rem)] items-center overflow-hidden px-5 pt-24 sm:px-8 lg:px-12"
      >
        {featuredMovie?.backdrop_path && (
          <div className="pointer-events-none absolute inset-0">
            <img
              src={`https://image.tmdb.org/t/p/w1280${featuredMovie.backdrop_path}`}
              alt=""
              aria-hidden="true"
              fetchPriority="high"
              className="h-full w-full object-cover opacity-25"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/55" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
          </div>
        )}

        <div className="hero-glow pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-[120px]" />

        <div className="hero-content relative z-10 mx-auto w-full max-w-[1600px]">
          <div className="hero-badge mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/60 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_10px_white]" />
            Your world of movies, series & people
          </div>

          <h1 className="max-w-5xl overflow-hidden text-5xl font-bold leading-[0.95] tracking-[-0.04em] sm:text-7xl lg:text-8xl xl:text-9xl">
            <span className="hero-title-line block">Discover.</span>
            <span className="hero-title-line block text-white/35">Connect.</span>
            <span className="hero-title-line block">Experience.</span>
          </h1>

          <p className="hero-description mt-8 max-w-2xl text-base leading-7 text-white/55 sm:text-lg">
            Discover movies, TV shows, people and unforgettable scenes.
            Build your watchlist, find your next obsession and experience
            entertainment with CineMate.
          </p>

          <div className="hero-buttons mt-8 flex flex-wrap gap-3">
            <Link
              to="/movies"
              className="group relative overflow-hidden rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(255,255,255,0.18)]"
            >
              <span className="relative z-10">Explore Movies</span>
              <span className="absolute inset-0 -translate-x-full skew-x-[-15deg] bg-black/10 transition-transform duration-500 group-hover:translate-x-full" />
            </Link>

            <Link
              to="/tv-shows"
              className="rounded-full border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-medium text-white transition-all duration-300 hover:-translate-y-1 hover:border-white/30 hover:bg-white/10"
            >
              Explore TV & Web Series
            </Link>
          </div>

          {featuredMovie && (
            <Link
              to={`/movie/${featuredMovie.id}`}
              className="mt-10 inline-flex max-w-full items-center gap-3 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 backdrop-blur-xl transition-all duration-300 hover:border-white/25 hover:bg-black/50"
            >
              <span className="text-xs uppercase tracking-[0.2em] text-white/35">Trending now</span>
              <span className="max-w-[220px] truncate text-sm font-medium text-white/85 sm:max-w-sm">
                {featuredMovie.title}
              </span>
              <span className="text-white/40">→</span>
            </Link>
          )}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black to-transparent" />
      </section>

      <TrendingMovies items={trendingMovieItems} />
      <TrendingTVSection items={trendingTVItems} />
      <PopularMovies items={popularMovieItems} />
      <PopularTVSection items={popularTVItems} />
      <GenreSection />
      <PeopleSpotlightSection items={popularPeopleItems} />
      <UpcomingMoviesSection items={upcomingMovieItems} />
      <InstagramSceneFinder />

      <section className="relative overflow-hidden px-5 py-24 sm:px-8 lg:px-12">
        <div className="relative mx-auto max-w-[1600px]">
          <div className="grid items-center gap-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] p-7 backdrop-blur-md sm:p-10 lg:grid-cols-[1.2fr_0.8fr] lg:p-14">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.15em] text-white/50">
                CineMate on Telegram
              </div>
              <h2 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Search CineMate
                <span className="block text-white/35">from Telegram.</span>
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/45 sm:text-lg">
                Connect Telegram and send movie or series searches directly
                to CineMate. Results appear in your app.
              </p>
              <Link
                to="/profile#telegram"
                className="mt-7 inline-flex items-center gap-3 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition-all duration-300 hover:-translate-y-1"
              >
                Connect Telegram →
              </Link>
            </div>

            <div className="mx-auto w-full max-w-sm rounded-[2rem] border border-white/10 bg-black/60 p-5 shadow-2xl">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black">
                    <span className="text-lg font-bold">T</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">CineMate Bot</p>
                    <p className="text-xs text-white/30">Telegram search</p>
                  </div>
                </div>
                <div className="mt-5 rounded-2xl bg-white px-4 py-3 text-sm text-black">
                  action movies
                </div>
                <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/30">CineMate</p>
                  <p className="mt-1 text-sm font-medium">Search results sent to your app.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SocialPreview />

      {/* ================= CHAT ================= */}

      <ChatPreview />

      {/* ================= FOOTER ================= */}

      <Footer />

    </main>
  );
};

export default Home;

