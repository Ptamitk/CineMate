
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import ContentGrid from "../content/ContentGrid";

gsap.registerPlugin(ScrollTrigger);

const PeopleSpotlightSection = ({ items = [] }) => {
  const sectionRef = useRef(null);

  useLayoutEffect(() => {
    if (!items.length || !sectionRef.current) return;

    const section = sectionRef.current;

    const ctx = gsap.context(() => {
      const header = section.querySelector(".people-spotlight-header");
      const grid = section.querySelector(".people-spotlight-grid");

      if (!header || !grid) return;

      const cards = grid.querySelectorAll("a");
      const isMobile = window.innerWidth < 768;

      /* =========================
         HEADER REVEAL
      ========================= */

      gsap.fromTo(
        header,
        {
          y: isMobile ? 30 : 60,
          opacity: 0,
          filter: isMobile
            ? "blur(2px)"
            : "blur(8px)",
        },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: isMobile ? 0.7 : 1,
          ease: "power4.out",
          scrollTrigger: {
            trigger: section,
            start: "top 82%",
            toggleActions: "play none none reverse",
          },
        }
      );

      /* =========================
         CARD REVEAL
      ========================= */

      if (cards.length) {
        gsap.fromTo(
          cards,
          {
            y: isMobile ? 25 : 55,
            opacity: 0,
            scale: isMobile ? 0.98 : 0.94,
          },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: isMobile ? 0.55 : 0.75,
            stagger: isMobile ? 0.05 : 0.08,
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
              y: -8,
              scale: 1.02,
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

          card._peopleEnter = handleEnter;
          card._peopleLeave = handleLeave;
        });
      }
    }, section);

    return () => {
      const cards = section.querySelectorAll(
        ".people-spotlight-grid a"
      );

      cards.forEach((card) => {
        if (card._peopleEnter) {
          card.removeEventListener(
            "mouseenter",
            card._peopleEnter
          );
        }

        if (card._peopleLeave) {
          card.removeEventListener(
            "mouseleave",
            card._peopleLeave
          );
        }

        delete card._peopleEnter;
        delete card._peopleLeave;
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

          {/* =========================
             HEADER
          ========================= */}

          <div className="people-spotlight-header mb-8">
            <p className="text-xs uppercase tracking-[0.2em] text-white/30">
              People Spotlight
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Popular People
            </h2>

            <p className="mt-3 max-w-2xl text-sm text-white/40">
              Discover popular actors, artists and other
              people shaping the world of entertainment.
            </p>
          </div>

          {/* =========================
             PEOPLE GRID
          ========================= */}

          <div className="people-spotlight-grid">
            <ContentGrid items={items} />
          </div>

        </div>
      )}
    </section>
  );
};

export default PeopleSpotlightSection;

