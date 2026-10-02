
import { useLayoutEffect, useRef } from "react";
import { ArrowUpRight, ScanSearch } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "react-router-dom";

gsap.registerPlugin(ScrollTrigger);

const InstagramSceneFinder = () => {
  const sectionRef = useRef(null);

  useLayoutEffect(() => {
    if (!sectionRef.current) {
      return;
    }

    const section = sectionRef.current;

    const ctx = gsap.context(() => {
      const container = section.querySelector(
        ".scene-finder-container"
      );

      const leftContent = section.querySelector(
        ".scene-finder-content"
      );

      const visual = section.querySelector(
        ".scene-finder-visual"
      );

      const preview = section.querySelector(
        ".scene-preview"
      );

      const scanIcon = section.querySelector(
        ".scene-scan-icon"
      );

      const resultCard = section.querySelector(
        ".scene-result-card"
      );

      const statusCard = section.querySelector(
        ".scene-status-card"
      );

      const scanLine = section.querySelector(
        ".scene-scan-line"
      );

      const isMobile = window.innerWidth < 768;

      /* =========================
         MAIN CONTAINER REVEAL
      ========================= */

      gsap.fromTo(
        container,
        {
          y: isMobile ? 35 : 80,
          opacity: 0,
          scale: isMobile ? 0.99 : 0.96,
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: isMobile ? 0.8 : 1.2,
          ease: "power4.out",
          scrollTrigger: {
            trigger: section,
            start: "top 82%",
            toggleActions: "play none none reverse",
          },
        }
      );

      /* =========================
         LEFT CONTENT
      ========================= */

      gsap.fromTo(
        leftContent.children,
        {
          y: isMobile ? 25 : 45,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: isMobile ? 0.55 : 0.75,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: container,
            start: "top 75%",
            toggleActions: "play none none reverse",
          },
        }
      );

      /* =========================
         VISUAL REVEAL
      ========================= */

      gsap.fromTo(
        visual,
        {
          x: isMobile ? 0 : 70,
          y: isMobile ? 25 : 0,
          opacity: 0,
          rotateY: isMobile ? 0 : 8,
        },
        {
          x: 0,
          y: 0,
          opacity: 1,
          rotateY: 0,
          duration: 1,
          delay: 0.15,
          ease: "power4.out",
          scrollTrigger: {
            trigger: container,
            start: "top 75%",
            toggleActions: "play none none reverse",
          },
        }
      );

      /* =========================
         SCANNER LINE
      ========================= */

      if (scanLine && preview) {
        gsap.fromTo(
          scanLine,
          {
            yPercent: -100,
            opacity: 0,
          },
          {
            yPercent: 1000,
            opacity: 1,
            duration: 2.8,
            repeat: -1,
            repeatDelay: 1.5,
            ease: "power1.inOut",
          }
        );
      }

      /* =========================
         SCAN ICON FLOAT
      ========================= */

      if (scanIcon) {
        gsap.to(scanIcon, {
          y: -8,
          scale: 1.05,
          duration: 1.8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });

        gsap.to(scanIcon, {
          boxShadow:
            "0 0 35px rgba(255,255,255,0.12)",
          duration: 1.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }

      /* =========================
         RESULT CARD FLOAT
      ========================= */

      if (resultCard) {
        gsap.to(resultCard, {
          y: -5,
          duration: 2.2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }

      /* =========================
         STATUS CARD FLOAT
      ========================= */

      if (statusCard) {
        gsap.to(statusCard, {
          y: -7,
          duration: 2.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: 0.5,
        });
      }

      /* =========================
         VISUAL PARALLAX
      ========================= */

      if (!isMobile && visual) {
        const handleMouseMove = (event) => {
          const rect = visual.getBoundingClientRect();

          const x =
            (event.clientX -
              (rect.left + rect.width / 2)) /
            rect.width;

          const y =
            (event.clientY -
              (rect.top + rect.height / 2)) /
            rect.height;

          gsap.to(visual, {
            rotateY: x * 5,
            rotateX: y * -5,
            duration: 0.8,
            ease: "power3.out",
            overwrite: true,
          });
        };

        const handleMouseLeave = () => {
          gsap.to(visual, {
            rotateY: 0,
            rotateX: 0,
            duration: 0.6,
            ease: "power3.out",
          });
        };

        visual.addEventListener(
          "mousemove",
          handleMouseMove
        );

        visual.addEventListener(
          "mouseleave",
          handleMouseLeave
        );

        visual._sceneMouseMove = handleMouseMove;
        visual._sceneMouseLeave = handleMouseLeave;
      }
    }, section);


    return () => {
      const visual = section.querySelector(
        ".scene-finder-visual"
      );

      if (visual?._sceneMouseMove) {
        visual.removeEventListener(
          "mousemove",
          visual._sceneMouseMove
        );
      }

      if (visual?._sceneMouseLeave) {
        visual.removeEventListener(
          "mouseleave",
          visual._sceneMouseLeave
        );
      }

      ctx.revert();
    };


  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden px-5 py-24 sm:px-8 lg:px-12"
    >
      {/* Background */}

      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.04] blur-[120px]" />

      <div className="relative mx-auto max-w-[1600px]">

        <div className="scene-finder-container grid items-center gap-12 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md sm:p-10 lg:grid-cols-2 lg:p-14">

          {/* Left */}

          <div className="scene-finder-content">

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.15em] text-white/50">
              <ScanSearch size={14} />
              Instagram Scene Finder
            </div>

            <h2 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Found a scene?

              <span className="block text-white/35">
                Find the movie.
              </span>
            </h2>

            <p className="mt-6 max-w-xl text-base leading-7 text-white/45 sm:text-lg">
              Share or paste an Instagram Reel with CineMate
              and discover the movie, TV show or web series
              behind the scene.
            </p>

            <Link
              to="/search"
              className="group mt-8 inline-flex items-center gap-3 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(255,255,255,0.15)]"
            >
              Try Scene Finder

              <ArrowUpRight
                size={17}
                className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
              />
            </Link>



          </div>

          {/* Right Visual */}

          <div className="scene-finder-visual relative [perspective:1000px]">

            <div className="relative mx-auto max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-black/70 p-5 shadow-2xl">

              {/* Reel preview */}

              <div className="scene-preview relative aspect-[9/13] overflow-hidden rounded-[1.5rem] border border-white/10 bg-gradient-to-b from-white/[0.08] to-black">

                {/* Fake cinematic glow */}

                <div className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.04] blur-[60px]" />

                {/* Scan Line */}

                <div className="scene-scan-line pointer-events-none absolute left-0 top-0 z-20 h-[2px] w-full bg-white/70 shadow-[0_0_20px_rgba(255,255,255,0.8)]" />

                {/* Scan Icon */}

                <div className="absolute inset-0 flex items-center justify-center">

                  <div className="scene-scan-icon flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-white/10 backdrop-blur-xl">
                    <ScanSearch size={32} />
                  </div>

                </div>

                {/* Result */}

                <div className="scene-result-card absolute inset-x-5 bottom-5">

                  <div className="rounded-2xl border border-white/10 bg-black/60 p-4 backdrop-blur-xl">

                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">
                      CineMate identified
                    </p>

                    <h3 className="mt-2 text-lg font-semibold">
                      Scene detected
                    </h3>

                    <p className="mt-1 text-xs text-white/40">
                      Movie / TV / Web Series
                    </p>

                  </div>

                </div>

              </div>

              {/* Scan Indicator */}

              <div className="scene-status-card absolute -right-3 top-10 rounded-2xl border border-white/10 bg-black/80 px-4 py-3 shadow-xl backdrop-blur-xl sm:-right-6">

                <div className="flex items-center gap-3">

                  <div className="h-2 w-2 rounded-full bg-white shadow-[0_0_12px_white]" />

                  <div>

                    <p className="text-xs font-medium">
                      Scene Finder
                    </p>

                    <p className="mt-0.5 text-[10px] text-white/35">
                      Ready to identify
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

export default InstagramSceneFinder;

