import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ContentCard from "./ContentCard";

gsap.registerPlugin(ScrollTrigger);

const ContentGrid = ({
  items = [],
  loading = false,
  skeletonCount = 12,
  showRemoveButton = false,
  onRemove,
  cinematic = true,
}) => {
  const gridRef = useRef(null);

  useLayoutEffect(() => {
    if (!cinematic || loading || !items.length || !gridRef.current) {
      return;
    }

    const grid = gridRef.current;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.innerWidth < 768;

    if (reduceMotion) return;

    const cards = Array.from(grid.querySelectorAll("[data-cinemate-card]"));
    if (!cards.length) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        cards,
        {
          x: (i) => (i % 2 === 0 ? -1 : 1) * (isMobile ? 24 + (i % 3) * 10 : 110 + (i % 4) * 45),
          y: (i) => (i % 3 === 0 ? -1 : 1) * (isMobile ? 18 : 65 + (i % 4) * 35),
          rotation: (i) => (i % 2 === 0 ? -1 : 1) * (isMobile ? 4 : 8 + (i % 4) * 2),
          scale: (i) => (isMobile ? 0.96 : 0.8 + (i % 3) * 0.03),
          opacity: 0,
          filter: isMobile ? "blur(1px)" : "blur(8px)",
        },
        {
          x: 0,
          y: 0,
          rotation: 0,
          scale: 1,
          opacity: 1,
          filter: "blur(0px)",
          duration: isMobile ? 0.75 : 1.2,
          stagger: {
            each: isMobile ? 0.035 : 0.07,
            from: "center",
          },
          ease: "expo.out",
          scrollTrigger: {
            trigger: grid,
            start: isMobile ? "top 92%" : "top 86%",
            toggleActions: "play none none reverse",
          },
        }
      );

      if (!isMobile) {
        cards.forEach((card) => {
          const move = (event) => {
            const rect = card.getBoundingClientRect();
            const px = (event.clientX - rect.left) / rect.width - 0.5;
            const py = (event.clientY - rect.top) / rect.height - 0.5;

            gsap.to(card, {
              rotationY: px * 8,
              rotationX: py * -8,
              y: -8,
              scale: 1.035,
              duration: 0.35,
              ease: "power3.out",
              overwrite: "auto",
            });
          };

          const leave = () => {
            gsap.to(card, {
              rotationX: 0,
              rotationY: 0,
              y: 0,
              scale: 1,
              duration: 0.5,
              ease: "power3.out",
              overwrite: "auto",
            });
          };

          card.addEventListener("mousemove", move);
          card.addEventListener("mouseleave", leave);
          card._cinemateMove = move;
          card._cinemateLeave = leave;
        });
      }
    }, grid);

    return () => {
      cards.forEach((card) => {
        if (card._cinemateMove) {
          card.removeEventListener("mousemove", card._cinemateMove);
        }
        if (card._cinemateLeave) {
          card.removeEventListener("mouseleave", card._cinemateLeave);
        }
        delete card._cinemateMove;
        delete card._cinemateLeave;
      });
      ctx.revert();
    };
  }, [items.length, loading, cinematic]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {Array.from({
          length: Math.max(1, skeletonCount),
        }).map((_, index) => (
          <div
            key={`skeleton-${index}`}
            className="aspect-[2/3] animate-pulse rounded-2xl border border-white/10 bg-white/[0.05]"
          />
        ))}
      </div>
    );
  }

  if (!Array.isArray(items) || items.length === 0) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] px-6 text-center">
        <p className="text-sm text-white/35">No content found.</p>
      </div>
    );
  }

  return (
    <div
      ref={gridRef}
      className="grid grid-cols-2 gap-4 [perspective:1200px] sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
    >
      {items.map((item, index) => {
        if (!item?.id || !item?.type) {
          return null;
        }

        return (
          <div
            key={`${item.type}-${item.id}`}
            data-cinemate-card
            className="will-change-transform"
          >
            <ContentCard
              content={item}
              index={index}
              showRemoveButton={showRemoveButton}
              onRemove={onRemove}
            />
          </div>
        );
      })}
    </div>
  );
};

export default ContentGrid;
