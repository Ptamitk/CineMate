
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { contentService } from "../../services/content/contentService";

import TrendingMovies from "../../components/movie/TrendingMovies";
import PopularMovies from "../../components/movie/PopularMovies";
import SocialPreview from "../../components/social/SocialPreview";
import ChatPreview from "../Chat/ChatPreview";
import Footer from "../../components/common/Footer";
import InstagramSceneFinder from "../../components/social/InstagramSceneFinder";
import WhatsAppDiscovery from "../../components/social/WhatsAppDiscovery";
import GenreSection from "../../components/content/GenreSection";
import TrendingTVSection from "../../components/tv/TrendingTVSection";
import PopularTVSection from "../../components/tv/PopularTVSection";
import UpcomingMoviesSection from "../../components/movie/UpcomingMoviesSection";
import PeopleSpotlightSection from "../../components/people/PeopleSpotlightSection";

gsap.registerPlugin(ScrollTrigger);

const Home = () => {
  const heroRef = useRef(null);

  const [trendingTV, setTrendingTV] = useState([]);
  const [popularTV, setPopularTV] = useState([]);
  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [popularPeople, setPopularPeople] = useState([]);

  useEffect(() => {
    const fetchDiscoveryData = async () => {
      try {
        const [
          trendingTVData,
          popularTVData,
          upcomingMoviesData,
          popularPeopleData,
        ] = await Promise.all([
          contentService.tv.trending(),
          contentService.tv.popular(),
          contentService.movies.upcoming(),
          contentService.people.popular(),
        ]);

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

  /* =========================
     NORMALIZE TV DATA
  ========================= */

  const normalizeTV = (items) =>
    items.slice(0, 10).map((item) => ({
      id: item.id,
      title: item.name,
      image: item.poster_path
        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
        : "",
      year: item.first_air_date
        ? item.first_air_date.slice(0, 4)
        : "",
      rating:
        typeof item.vote_average === "number"
          ? item.vote_average.toFixed(1)
          : "",
      type: "tv",
    }));

  /* =========================
     NORMALIZE MOVIE DATA
  ========================= */

  const normalizeMovies = (items) =>
    items.slice(0, 10).map((item) => ({
      id: item.id,
      title: item.title,
      image: item.poster_path
        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
        : "",
      year: item.release_date
        ? item.release_date.slice(0, 4)
        : "",
      rating:
        typeof item.vote_average === "number"
          ? item.vote_average.toFixed(1)
          : "",
      type: "movie",
    }));

  /* =========================
     NORMALIZE PEOPLE DATA
  ========================= */

  const normalizePeople = (items) =>
    items.slice(0, 10).map((item) => ({
      id: item.id,
      title: item.name,
      image: item.profile_path
        ? `https://image.tmdb.org/t/p/w500${item.profile_path}`
        : "",
      year: "",
      rating: "",
      type: "person",
    }));

  const trendingTVItems = normalizeTV(trendingTV);

  const popularTVItems = normalizeTV(popularTV);

  const upcomingMovieItems =
    normalizeMovies(upcomingMovies);

  const popularPeopleItems =
    normalizePeople(popularPeople);

  return (
    <main className="min-h-screen bg-black text-white">

      {/* ================= HERO ================= */}

      <section
        ref={heroRef}
        className="relative flex min-h-screen items-center overflow-hidden px-5 pt-20 sm:px-8 lg:px-12"
      >
        {/* Ambient Glow */}

        <div className="hero-glow pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-[120px]" />

        {/* Extra cinematic light */}

        <div className="pointer-events-none absolute left-[15%] top-[20%] h-40 w-40 rounded-full bg-white/[0.025] blur-[80px]" />

        <div className="pointer-events-none absolute bottom-[15%] right-[10%] h-52 w-52 rounded-full bg-white/[0.025] blur-[100px]" />

        {/* Hero Content */}

        <div className="hero-content relative z-10 mx-auto w-full max-w-[1600px]">

          {/* Badge */}

          <div className="hero-badge mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/60 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_10px_white]" />

            Your world of entertainment & people
          </div>

          {/* Title */}

          <h1 className="max-w-5xl overflow-hidden text-5xl font-bold leading-[0.95] tracking-[-0.04em] sm:text-7xl lg:text-8xl xl:text-9xl">

            <span className="hero-title-line block">
              Discover.
            </span>

            <span className="hero-title-line block text-white/35">
              Connect.
            </span>

            <span className="hero-title-line block">
              Experience.
            </span>

          </h1>

          {/* Description */}

          <p className="hero-description mt-8 max-w-xl text-base leading-7 text-white/50 sm:text-lg">
            Discover entertainment, connect with people,
            share what you love, and experience everything
            in one place.
          </p>

          {/* Buttons */}

          <div className="hero-buttons mt-8 flex flex-wrap gap-3">

            <Link
              to="/movies"
              className="group relative overflow-hidden rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(255,255,255,0.18)]"
            >
              <span className="relative z-10">
                Explore CineMate
              </span>

              <span className="absolute inset-0 -translate-x-full skew-x-[-15deg] bg-black/10 transition-transform duration-500 group-hover:translate-x-full" />
            </Link>

            <Link
              to="/signup"
              className="rounded-full border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-medium text-white transition-all duration-300 hover:-translate-y-1 hover:border-white/30 hover:bg-white/10"
            >
              Join CineMate
            </Link>

          </div>
        </div>

        {/* Bottom cinematic fade */}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black to-transparent" />
      </section>

      {/* ================= MOVIES ================= */}

      <TrendingMovies />

      {/* ================= TV / WEB SERIES ================= */}

      <TrendingTVSection items={trendingTVItems} />

      {/* ================= POPULAR MOVIES ================= */}

      <PopularMovies />

      {/* ================= POPULAR TV ================= */}

      <PopularTVSection items={popularTVItems} />

      {/* ================= GENRES ================= */}

      <GenreSection />

      {/* ================= PEOPLE SPOTLIGHT ================= */}

      <PeopleSpotlightSection items={popularPeopleItems} />

      {/* ================= UPCOMING MOVIES ================= */}

      <UpcomingMoviesSection items={upcomingMovieItems} />

      {/* ================= INSTAGRAM ================= */}

      <InstagramSceneFinder />

      {/* ================= WHATSAPP + TV ================= */}

      <WhatsAppDiscovery />

      {/* ================= SOCIAL ================= */}

      <SocialPreview />

      {/* ================= CHAT ================= */}

      <ChatPreview />

      {/* ================= FOOTER ================= */}

      <Footer />

    </main>
  );
};

export default Home;

