
import { useLayoutEffect, useRef } from "react";
import { MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const Footer = () => {
  const footerRef = useRef(null);

  useLayoutEffect(() => {
    if (!footerRef.current) {
      return;
    }

    const footer = footerRef.current;

    const ctx = gsap.context(() => {
      const glow = footer.querySelector(".footer-glow");
      const topContent = footer.querySelector(".footer-top");
      const brand = footer.querySelector(".footer-brand");
      const columns = footer.querySelectorAll(".footer-column");
      const socialIcons = footer.querySelectorAll(
        ".footer-social"
      );
      const divider = footer.querySelector(
        ".footer-divider"
      );
      const bottom = footer.querySelector(
        ".footer-bottom"
      );

      const isMobile = window.innerWidth < 768;

      /* =========================
         TOP CONTENT REVEAL
      ========================= */

      if (topContent) {
        gsap.fromTo(
          topContent,
          {
            y: isMobile ? 35 : 70,
            opacity: 0,
          },
          {
            y: 0,
            opacity: 1,
            duration: isMobile ? 0.7 : 1,
            ease: "power4.out",
            scrollTrigger: {
              trigger: footer,
              start: "top 88%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }

      /* =========================
         BRAND REVEAL
      ========================= */

      if (brand) {
        gsap.fromTo(
          brand.children,
          {
            y: 25,
            opacity: 0,
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.65,
            stagger: 0.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: footer,
              start: "top 82%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }

      /* =========================
         FOOTER COLUMNS
      ========================= */

      if (columns.length) {
        gsap.fromTo(
          columns,
          {
            y: isMobile ? 25 : 45,
            opacity: 0,
          },
          {
            y: 0,
            opacity: 1,
            duration: isMobile ? 0.55 : 0.7,
            stagger: isMobile ? 0.08 : 0.12,
            ease: "power3.out",
            scrollTrigger: {
              trigger: topContent,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }

      /* =========================
         SOCIAL ICONS
      ========================= */

      if (socialIcons.length) {
        gsap.fromTo(
          socialIcons,
          {
            y: 15,
            opacity: 0,
            scale: 0.9,
          },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.5,
            stagger: 0.08,
            ease: "back.out(1.5)",
            scrollTrigger: {
              trigger: brand,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          }
        );

        if (!isMobile) {
          socialIcons.forEach((icon) => {
            const handleEnter = () => {
              gsap.to(icon, {
                y: -5,
                scale: 1.08,
                duration: 0.3,
                ease: "power3.out",
              });
            };

            const handleLeave = () => {
              gsap.to(icon, {
                y: 0,
                scale: 1,
                duration: 0.35,
                ease: "power3.out",
              });
            };

            icon.addEventListener(
              "mouseenter",
              handleEnter
            );

            icon.addEventListener(
              "mouseleave",
              handleLeave
            );

            icon._footerEnter = handleEnter;
            icon._footerLeave = handleLeave;
          });
        }
      }

      /* =========================
         GLOW ANIMATION
      ========================= */

      if (glow) {
        gsap.to(glow, {
          x: 60,
          scale: 1.15,
          opacity: 0.8,
          duration: 5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }

      /* =========================
         DIVIDER REVEAL
      ========================= */

      if (divider) {
        gsap.fromTo(
          divider,
          {
            scaleX: 0,
            transformOrigin: "left center",
          },
          {
            scaleX: 1,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: divider,
              start: "top 90%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }

      /* =========================
         BOTTOM BAR
      ========================= */

      if (bottom) {
        gsap.fromTo(
          bottom,
          {
            y: 20,
            opacity: 0,
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: {
              trigger: bottom,
              start: "top 92%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }
    }, footer);

    return () => {
      const socialIcons = footer.querySelectorAll(
        ".footer-social"
      );

      socialIcons.forEach((icon) => {
        if (icon._footerEnter) {
          icon.removeEventListener(
            "mouseenter",
            icon._footerEnter
          );
        }

        if (icon._footerLeave) {
          icon.removeEventListener(
            "mouseleave",
            icon._footerLeave
          );
        }

        delete icon._footerEnter;
        delete icon._footerLeave;
      });

      ctx.revert();
    };
  }, []);

  return (
    <footer
      ref={footerRef}
      className="relative overflow-hidden border-t border-white/10 bg-black px-5 py-16 sm:px-8 lg:px-12 lg:py-24"
    >
      {/* Background glow */}

      <div className="footer-glow pointer-events-none absolute left-1/2 top-0 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-white/[0.03] blur-[120px]" />

      <div className="relative mx-auto max-w-[1600px]">
        {/* Top */}

        <div className="footer-top grid gap-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Brand */}

          <div className="footer-brand">
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white font-black text-black transition-transform duration-300 hover:scale-105"
              >
                C
              </Link>

              <Link
                to="/"
                className="text-xl font-semibold"
              >
                CineMate
              </Link>
            </div>

            <p className="mt-5 max-w-sm text-sm leading-6 text-white/35">
              Discover movies, connect with people, share
              your thoughts, and experience cinema together.
            </p>

            {/* Social icons */}

            <div className="mt-6 flex gap-2">
              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="footer-social flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-medium transition-colors duration-300 hover:border-white/25 hover:bg-white/10"
              >
                IG
              </a>

              <a
                href="https://x.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="X"
                className="footer-social flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-medium transition-colors duration-300 hover:border-white/25 hover:bg-white/10"
              >
                X
              </a>

              <a
                href="https://www.youtube.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
                className="footer-social flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-medium transition-colors duration-300 hover:border-white/25 hover:bg-white/10"
              >
                YT
              </a>
            </div>
          </div>

          {/* Discover */}

          <div className="footer-column">
            <h3 className="text-sm font-semibold">
              Discover
            </h3>

            <div className="mt-5 flex flex-col gap-3">
              <Link
                to="/movies"
                className="w-fit text-sm text-white/35 transition-all duration-300 hover:translate-x-1 hover:text-white"
              >
                Movies
              </Link>

              <Link
                to="/search"
                className="w-fit text-sm text-white/35 transition-all duration-300 hover:translate-x-1 hover:text-white"
              >
                Search
              </Link>

              <Link
                to="/movies"
                className="w-fit text-sm text-white/35 transition-all duration-300 hover:translate-x-1 hover:text-white"
              >
                Trending
              </Link>

              <Link
                to="/watchlist"
                className="w-fit text-sm text-white/35 transition-all duration-300 hover:translate-x-1 hover:text-white"
              >
                Watchlist
              </Link>
            </div>
          </div>

          {/* Community */}

          <div className="footer-column">
            <h3 className="text-sm font-semibold">
              Community
            </h3>

            <div className="mt-5 flex flex-col gap-3">
              <Link
                to="/social"
                className="w-fit text-sm text-white/35 transition-all duration-300 hover:translate-x-1 hover:text-white"
              >
                Social Feed
              </Link>

              <Link
                to="/chat"
                className="w-fit text-sm text-white/35 transition-all duration-300 hover:translate-x-1 hover:text-white"
              >
                Messages
              </Link>

              <Link
                to="/profile"
                className="w-fit text-sm text-white/35 transition-all duration-300 hover:translate-x-1 hover:text-white"
              >
                Profiles
              </Link>

              <Link
                to="/social"
                className="w-fit text-sm text-white/35 transition-all duration-300 hover:translate-x-1 hover:text-white"
              >
                Community
              </Link>
            </div>
          </div>

          {/* Product */}

          <div className="footer-column">
            <h3 className="text-sm font-semibold">
              CineMate
            </h3>

            <div className="mt-5 flex flex-col gap-3">
              <Link
                to="/"
                className="w-fit text-sm text-white/35 transition-all duration-300 hover:translate-x-1 hover:text-white"
              >
                About
              </Link>

              <Link
                to="/"
                className="w-fit text-sm text-white/35 transition-all duration-300 hover:translate-x-1 hover:text-white"
              >
                Privacy
              </Link>

              <Link
                to="/"
                className="w-fit text-sm text-white/35 transition-all duration-300 hover:translate-x-1 hover:text-white"
              >
                Terms
              </Link>

              <Link
                to="/chat"
                className="w-fit text-sm text-white/35 transition-all duration-300 hover:translate-x-1 hover:text-white"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>

        {/* Divider */}

        <div className="footer-divider my-12 h-px bg-white/10" />

        {/* Bottom */}

        <div className="footer-bottom flex flex-col justify-between gap-4 text-xs text-white/25 sm:flex-row">
          <p>
            © 2026 CineMate. All rights reserved.
          </p>

          <div className="flex items-center gap-2">
            <MessageCircle size={14} />

            <span>
              Movies are better together.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

