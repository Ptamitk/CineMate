
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import ContentGrid from "../content/ContentGrid";

gsap.registerPlugin(ScrollTrigger);

const PopularTVSection = ({ items = [] }) => {
  const sectionRef = useRef(null);

  useLayoutEffect(() => {
    if (!items.length || !sectionRef.current) {
      return;
    }

    const section = sectionRef.current;

    const ctx = gsap.context(() => {
      const header = section.querySelector(
        ".popular-tv-header"
      );

      const grid = section.querySelector(
        ".popular-tv-grid"
      );

      if (!header || !grid) {
        return;
      }

      const cards = grid.querySelectorAll("a");

      const isMobile = window.innerWidth < 768;

      /* =========================
         HEADER REVEAL
      ========================= */

      gsap.fromTo(
        header,
        {
          y: isMobile ? 30 : 65,
          opacity: 0,
          filter: isMobile
            ? "blur(2px)"
            : "blur(10px)",
        },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: isMobile ? 0.7 : 1.1,
          ease: "power4.out",
          scrollTrigger: {
            trigger: section,
            start: "top 82%",
            toggleActions: "play none none reverse",
          },
        }
      );

      /* =========================
         CARDS CINEMATIC REVEAL
      ========================= */

      if (cards.length) {
        gsap.fromTo(
          cards,
          {
            y: isMobile ? 25 : 70,
            opacity: 0,
            scale: isMobile ? 0.98 : 0.92,
            rotateX: isMobile ? 0 : 8,
          },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            rotateX: 0,
            duration: isMobile ? 0.55 : 0.8,
            stagger: isMobile ? 0.05 : 0.09,
            ease: "power3.out",
            scrollTrigger: {
              trigger: grid,
              start: "top 88%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }

      /* =========================
         DESKTOP HOVER
      ========================= */

      if (!isMobile) {
        cards.forEach((card) => {
          const handleEnter = () => {
            gsap.to(card, {
              y: -10,
              scale: 1.025,
              duration: 0.35,
              ease: "power3.out",
              overwrite: true,
            });
          };

          const handleLeave = () => {
            gsap.to(card, {
              y: 0,
              scale: 1,
              duration: 0.4,
              ease: "power3.out",
              overwrite: true,
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

          card._popularTVEnter = handleEnter;
          card._popularTVLeave = handleLeave;
        });
      }
    }, section);

    return () => {
      const cards = section.querySelectorAll(
        ".popular-tv-grid a"
      );

      cards.forEach((card) => {
        if (card._popularTVEnter) {
          card.removeEventListener(
            "mouseenter",
            card._popularTVEnter
          );
        }

        if (card._popularTVLeave) {
          card.removeEventListener(
            "mouseleave",
            card._popularTVLeave
          );
        }

        delete card._popularTVEnter;
        delete card._popularTVLeave;
      });

      ctx.revert();
    };
  }, [items.length]);

  return (
    <section
      ref={sectionRef}
      className="relative mx-auto max-w-[1600px] overflow-hidden px-5 pt-20 sm:px-8 lg:px-12"
    >
      {items.length > 0 && (
        <div className="relative z-10">

          {/* Header */}

          <div className="popular-tv-header mb-8">
            <p className="text-xs uppercase tracking-[0.2em] text-white/30">
              Popular
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Popular TV & Web Series
            </h2>

            <p className="mt-3 max-w-2xl text-sm text-white/40">
              Explore popular TV shows and web series
              from around the world.
            </p>
          </div>

          {/* Cards */}

          <div className="popular-tv-grid">
            <ContentGrid items={items} animation="orbit" />
          </div>

        </div>
      )}
    </section>
  );
};

export default PopularTVSection;

