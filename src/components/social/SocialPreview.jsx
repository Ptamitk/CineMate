
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
} from "lucide-react";
import { Link } from "react-router-dom";

gsap.registerPlugin(ScrollTrigger);

const posts = [
  {
    id: 1,
    user: "Alex Morgan",
    handle: "@alexmovies",
    movie: "Interstellar",
    text: "Some movies don't just tell a story. They make you feel something.",
    image:
      "https://image.tmdb.org/t/p/w780/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    likes: "12.8K",
  },
  {
    id: 2,
    user: "Sarah Wilson",
    handle: "@sarahcine",
    movie: "Dune",
    text: "The atmosphere, visuals and sound design are absolutely incredible.",
    image:
      "https://image.tmdb.org/t/p/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    likes: "8.4K",
  },
];

const SocialPreview = () => {
  const sectionRef = useRef(null);

  useLayoutEffect(() => {
    if (!sectionRef.current) {
      return;
    }

    const section = sectionRef.current;

    const ctx = gsap.context(() => {
      const heading = section.querySelector(
        ".social-heading"
      );

      const feed = section.querySelector(
        ".social-feed"
      );

      const cards = section.querySelectorAll(
        ".social-post"
      );

      const images = section.querySelectorAll(
        ".social-post-image"
      );

      const cta = section.querySelector(
        ".social-cta"
      );

      const isMobile = window.innerWidth < 768;

      /* =========================
         HEADING REVEAL
      ========================= */

      if (heading) {
        gsap.fromTo(
          heading.children,
          {
            y: isMobile ? 30 : 65,
            opacity: 0,
            filter: isMobile
              ? "blur(2px)"
              : "blur(8px)",
          },
          {
            y: 0,
            opacity: 1,
            filter: "blur(0px)",
            duration: isMobile ? 0.65 : 0.9,
            stagger: 0.1,
            ease: "power4.out",
            scrollTrigger: {
              trigger: section,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }

      /* =========================
         POSTS REVEAL
      ========================= */

      if (cards.length) {
        gsap.fromTo(
          cards,
          {
            y: isMobile ? 35 : 100,
            opacity: 0,
            scale: isMobile ? 0.98 : 0.94,
            rotateX: isMobile ? 0 : 6,
          },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            rotateX: 0,
            duration: isMobile ? 0.65 : 0.9,
            stagger: isMobile ? 0.12 : 0.2,
            ease: "power4.out",
            scrollTrigger: {
              trigger: feed,
              start: "top 82%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }

      /* =========================
         IMAGE PARALLAX
      ========================= */

      if (images.length && !isMobile) {
        images.forEach((image) => {
          gsap.fromTo(
            image,
            {
              scale: 1.12,
              y: 20,
            },
            {
              scale: 1,
              y: 0,
              ease: "none",
              scrollTrigger: {
                trigger: image,
                start: "top 90%",
                end: "bottom 20%",
                scrub: 1,
              },
            }
          );
        });
      }

      /* =========================
         CTA REVEAL
      ========================= */

      if (cta) {
        gsap.fromTo(
          cta,
          {
            y: 30,
            opacity: 0,
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: {
              trigger: cta,
              start: "top 90%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }

      /* =========================
         DESKTOP CARD HOVER
      ========================= */

      if (!isMobile) {
        cards.forEach((card) => {
          const image = card.querySelector(
            ".social-post-image"
          );

          const handleEnter = () => {
            gsap.to(card, {
              y: -8,
              scale: 1.015,
              duration: 0.4,
              ease: "power3.out",
              overwrite: true,
            });

            if (image) {
              gsap.to(image, {
                scale: 1.06,
                duration: 0.7,
                ease: "power3.out",
                overwrite: true,
              });
            }
          };

          const handleLeave = () => {
            gsap.to(card, {
              y: 0,
              scale: 1,
              duration: 0.45,
              ease: "power3.out",
              overwrite: true,
            });

            if (image) {
              gsap.to(image, {
                scale: 1,
                duration: 0.7,
                ease: "power3.out",
                overwrite: true,
              });
            }
          };

          card.addEventListener(
            "mouseenter",
            handleEnter
          );

          card.addEventListener(
            "mouseleave",
            handleLeave
          );

          card._socialEnter = handleEnter;
          card._socialLeave = handleLeave;
        });
      }
    }, section);

    return () => {
      const cards = section.querySelectorAll(
        ".social-post"
      );

      cards.forEach((card) => {
        if (card._socialEnter) {
          card.removeEventListener(
            "mouseenter",
            card._socialEnter
          );
        }

        if (card._socialLeave) {
          card.removeEventListener(
            "mouseleave",
            card._socialLeave
          );
        }

        delete card._socialEnter;
        delete card._socialLeave;
      });

      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-black px-5 py-24 sm:px-8 lg:px-12 lg:py-32"
    >
      <div className="mx-auto max-w-[1200px]">

        {/* Heading */}

        <div className="social-heading mb-12 text-center">

          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-white/35">
            CineMate Community
          </p>

          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Movies are better together.
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-white/40 sm:text-base">
            Share what you're watching, discover recommendations,
            and connect with people who love the same movies.
          </p>

        </div>

        {/* Feed */}

        <div className="social-feed grid gap-6 md:grid-cols-2">

          {posts.map((post) => (
            <article
              key={post.id}
              className="social-post group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition-colors duration-500 hover:border-white/20 hover:bg-white/[0.05] hover:shadow-[0_30px_80px_rgba(255,255,255,0.08)]"
            >

              {/* User Header */}

              <div className="flex items-center justify-between p-5">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-bold text-black">
                    {post.user.charAt(0)}
                  </div>

                  <div>

                    <h3 className="text-sm font-semibold">
                      {post.user}
                    </h3>

                    <p className="text-xs text-white/35">
                      {post.handle}
                    </p>

                  </div>

                </div>

                <Link
                  to="/social"
                  className="inline-flex rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm text-white/60 transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/10 hover:text-white"
                >
                  Explore Community →
                </Link>



              </div>

              {/* Movie Image */}

              <div className="relative aspect-[16/10] overflow-hidden">

                <img
                  src={post.image}
                  alt={post.movie}
                  className="social-post-image h-full w-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                {/* Movie tag */}

                <div className="absolute bottom-4 left-4 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-xs backdrop-blur-md">
                  🎬 {post.movie}
                </div>

              </div>

              {/* Content */}

              <div className="p-5">

                <p className="text-sm leading-6 text-white/65">
                  {post.text}
                </p>

                {/* Actions */}

                <div className="mt-5 flex items-center justify-between">

                  <div className="flex items-center gap-5">

                    <button className="group/icon flex items-center gap-2 text-white/45 transition-colors hover:text-white">

                      <Heart
                        size={19}
                        className="transition-transform duration-300 group-hover/icon:scale-125"
                      />

                      <span className="text-xs">
                        {post.likes}
                      </span>

                    </button>

                    <button className="text-white/45 transition-all hover:scale-110 hover:text-white">
                      <MessageCircle size={19} />
                    </button>

                    <button className="text-white/45 transition-all hover:scale-110 hover:text-white">
                      <Share2 size={19} />
                    </button>

                  </div>

                  <button className="text-white/45 transition-all hover:scale-110 hover:text-white">
                    <Bookmark size={19} />
                  </button>

                </div>

              </div>

            </article>
          ))}

        </div>

        {/* CTA */}

        <div className="social-cta mt-10 text-center">

          <button className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm text-white/60 transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/10 hover:text-white">
            Explore Community →
          </button>

        </div>

      </div>
    </section>
  );
};

export default SocialPreview;

