import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ContentCard from "./ContentCard";

gsap.registerPlugin(ScrollTrigger);

const VARIANTS = ["scatter", "wave", "orbit", "rise", "depth", "snap"];

const ContentGrid = ({
  items = [],
  loading = false,
  skeletonCount = 12,
  showRemoveButton = false,
  onRemove,
  cinematic = true,
  animation = "auto",
}) => {
  const gridRef = useRef(null);

  useLayoutEffect(() => {
    if (!cinematic || loading || !items.length || !gridRef.current) return;

    const grid = gridRef.current;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.innerWidth < 768;
    if (reduceMotion) return;

    const cards = Array.from(grid.querySelectorAll("[data-cinemate-card]"));
    if (!cards.length) return;

    const variant =
      animation === "auto"
        ? VARIANTS[Math.floor(grid.getBoundingClientRect().top / 400) % VARIANTS.length]
        : animation;

    const ctx = gsap.context(() => {
      const distance = isMobile ? 22 : 100;
      const makeFrom = (i) => {
        const row = Math.floor(i / (isMobile ? 2 : 5));
        const col = i % (isMobile ? 2 : 5);
        const center = ((isMobile ? 1 : 2) - col) * distance;

        switch (variant) {
          case "wave":
            return {
              x: isMobile ? (i % 2 ? 14 : -14) : Math.sin(i * 1.4) * 120,
              y: isMobile ? 20 + (i % 2) * 12 : 55 + Math.sin(i * 0.9) * 70,
              rotation: isMobile ? 0 : Math.sin(i * 1.7) * 8,
              scale: isMobile ? 0.97 : 0.88,
              opacity: 0,
              filter: isMobile ? "blur(1px)" : "blur(7px)",
            };
          case "orbit":
            return {
              x: Math.cos(i * 1.8) * (isMobile ? 28 : 150),
              y: Math.sin(i * 1.8) * (isMobile ? 24 : 110),
              rotation: isMobile ? 0 : Math.cos(i) * 18,
              scale: isMobile ? 0.96 : 0.76 + (i % 3) * 0.04,
              opacity: 0,
              filter: isMobile ? "blur(1px)" : "blur(9px)",
            };
          case "rise":
            return {
              x: center * 0.45,
              y: isMobile ? 50 + row * 8 : 120 + row * 28,
              rotation: isMobile ? (i % 2 ? 2 : -2) : (i % 2 ? 7 : -7),
              scale: isMobile ? 0.96 : 0.84,
              opacity: 0,
              filter: isMobile ? "blur(1px)" : "blur(8px)",
            };
          case "depth":
            return {
              x: center * 0.7,
              y: isMobile ? 18 : 45 + row * 22,
              z: isMobile ? 0 : -260 - (i % 3) * 70,
              rotationX: isMobile ? 0 : 18,
              rotationY: isMobile ? 0 : (i % 2 ? 12 : -12),
              rotation: 0,
              scale: isMobile ? 0.97 : 0.72,
              opacity: 0,
              filter: isMobile ? "blur(1px)" : "blur(10px)",
            };
          case "snap":
            return {
              x: center * 1.35,
              y: isMobile ? (i % 2 ? -25 : 25) : (i % 2 ? -90 : 90),
              rotation: isMobile ? 0 : (i % 2 ? 14 : -14),
              scale: isMobile ? 0.94 : 0.8,
              opacity: 0,
              filter: isMobile ? "blur(1px)" : "blur(6px)",
            };
          case "scatter":
          default:
            return {
              x: (i % 2 === 0 ? -1 : 1) * (isMobile ? 24 + (i % 3) * 10 : 110 + (i % 4) * 45),
              y: (i % 3 === 0 ? -1 : 1) * (isMobile ? 18 : 65 + (i % 4) * 35),
              rotation: (i % 2 === 0 ? -1 : 1) * (isMobile ? 4 : 8 + (i % 4) * 2),
              scale: isMobile ? 0.96 : 0.8 + (i % 3) * 0.03,
              opacity: 0,
              filter: isMobile ? "blur(1px)" : "blur(8px)",
            };
        }
      };

      const fromState = cards.map((_, i) => makeFrom(i));

      gsap.set(cards, { transformPerspective: 1200 });
      gsap.fromTo(
        cards,
        {
          ...fromState[0],
          x: (i) => fromState[i].x,
          y: (i) => fromState[i].y,
          z: (i) => fromState[i].z || 0,
          rotation: (i) => fromState[i].rotation || 0,
          rotationX: (i) => fromState[i].rotationX || 0,
          rotationY: (i) => fromState[i].rotationY || 0,
          scale: (i) => fromState[i].scale,
          opacity: 0,
          filter: (i) => fromState[i].filter,
        },
        {
          x: 0,
          y: 0,
          z: 0,
          rotation: 0,
          rotationX: 0,
          rotationY: 0,
          scale: 1,
          opacity: 1,
          filter: "blur(0px)",
          duration: isMobile ? 0.72 : variant === "orbit" ? 1.35 : 1.05,
          stagger: {
            each: isMobile ? 0.035 : variant === "rise" ? 0.055 : 0.075,
            from: variant === "wave" ? "start" : "center",
          },
          ease: variant === "snap" ? "back.out(1.7)" : "expo.out",
          scrollTrigger: {
            trigger: grid,
            start: isMobile ? "top 92%" : "top 86%",
            toggleActions: "play none none reverse",
          },
        }
      );

      if (variant === "orbit" && !isMobile) {
        gsap.to(cards, {
          y: (i) => Math.sin(i * 1.2) * 5,
          duration: 2.4,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          stagger: 0.08,
        });
      }

      if (variant === "wave") {
        gsap.fromTo(
          grid,
          { "--grid-glow": 0 },
          {
            "--grid-glow": 1,
            duration: 1.1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: grid,
              start: "top 80%",
              toggleActions: "play reverse play reverse",
            },
          }
        );
      }

      if (!isMobile) {
        cards.forEach((card, index) => {
          const move = (event) => {
            const rect = card.getBoundingClientRect();
            const px = (event.clientX - rect.left) / rect.width - 0.5;
            const py = (event.clientY - rect.top) / rect.height - 0.5;
            const hoverVariant = index % 3;

            gsap.to(card, {
              rotationY: px * (hoverVariant === 0 ? 10 : 7),
              rotationX: py * (hoverVariant === 1 ? -10 : -7),
              y: hoverVariant === 2 ? -12 : -7,
              x: hoverVariant === 2 ? px * 6 : 0,
              scale: hoverVariant === 1 ? 1.045 : 1.03,
              duration: 0.35,
              ease: "power3.out",
              overwrite: "auto",
            });
          };

          const leave = () => {
            gsap.to(card, {
              rotationX: 0,
              rotationY: 0,
              x: 0,
              y: 0,
              scale: 1,
              duration: 0.55,
              ease: "elastic.out(1, 0.55)",
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
        if (card._cinemateMove) card.removeEventListener("mousemove", card._cinemateMove);
        if (card._cinemateLeave) card.removeEventListener("mouseleave", card._cinemateLeave);
        delete card._cinemateMove;
        delete card._cinemateLeave;
      });
      ctx.revert();
    };
  }, [items.length, loading, cinematic, animation]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {Array.from({ length: Math.max(1, skeletonCount) }).map((_, index) => (
          <div key={`skeleton-${index}`} className="aspect-[2/3] animate-pulse rounded-2xl border border-white/10 bg-white/[0.05]" />
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
      style={{ "--grid-glow": 0 }}
      className="grid grid-cols-2 gap-4 [perspective:1200px] sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
    >
      {items.map((item, index) => {
        if (!item?.id || !item?.type) return null;

        return (
          <div key={`${item.type}-${item.id}`} data-cinemate-card className="will-change-transform">
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
