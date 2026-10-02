
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  CheckCheck,
  MoreVertical,
  Phone,
  Search,
  Send,
  Video,
} from "lucide-react";
import { Link } from "react-router-dom";

gsap.registerPlugin(ScrollTrigger);

const conversations = [
  {
    id: 1,
    name: "Rahul Sharma",
    message: "Bro, have you watched Dune?",
    time: "8:42 PM",
    active: true,
  },
  {
    id: 2,
    name: "Movie Club",
    message: "New recommendation 🔥",
    time: "8:21 PM",
    active: false,
  },
  {
    id: 3,
    name: "Priya",
    message: "That ending was crazy!",
    time: "7:58 PM",
    active: false,
  },
];

const ChatPreview = () => {
  const sectionRef = useRef(null);

  useLayoutEffect(() => {
    if (!sectionRef.current) {
      return;
    }

    const section = sectionRef.current;

    const ctx = gsap.context(() => {
      const heading = section.querySelector(
        ".chat-heading"
      );

      const wrapper = section.querySelector(
        ".chat-wrapper"
      );

      const windowElement = section.querySelector(
        ".chat-window"
      );

      const sidebar = section.querySelector(
        ".chat-sidebar"
      );

      const chatHeader = section.querySelector(
        ".chat-header"
      );

      const messages = section.querySelectorAll(
        ".chat-message"
      );

      const movieCard = section.querySelector(
        ".chat-movie-card"
      );

      const movieImage = section.querySelector(
        ".chat-movie-image"
      );

      const input = section.querySelector(
        ".chat-input"
      );

      const cta = section.querySelector(
        ".chat-cta"
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
         CHAT WINDOW ENTRY
      ========================= */

      if (windowElement) {
        gsap.fromTo(
          windowElement,
          {
            y: isMobile ? 40 : 110,
            opacity: 0,
            scale: isMobile ? 0.98 : 0.94,
            rotateX: isMobile ? 0 : 7,
          },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            rotateX: 0,
            duration: isMobile ? 0.8 : 1.2,
            ease: "power4.out",
            scrollTrigger: {
              trigger: wrapper,
              start: "top 82%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }

      /* =========================
         SIDEBAR REVEAL
      ========================= */

      if (sidebar && !isMobile) {
        gsap.fromTo(
          sidebar,
          {
            x: -35,
            opacity: 0,
          },
          {
            x: 0,
            opacity: 1,
            duration: 0.8,
            delay: 0.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: wrapper,
              start: "top 75%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }

      /* =========================
         CHAT HEADER
      ========================= */

      if (chatHeader) {
        gsap.fromTo(
          chatHeader.children,
          {
            y: -15,
            opacity: 0,
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            stagger: 0.08,
            delay: 0.25,
            ease: "power3.out",
            scrollTrigger: {
              trigger: wrapper,
              start: "top 75%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }

      /* =========================
         MESSAGES STAGGER
      ========================= */

      if (messages.length) {
        gsap.fromTo(
          messages,
          {
            y: 25,
            x: (index) =>
              index % 2 === 0 ? -35 : 35,
            opacity: 0,
            scale: 0.96,
          },
          {
            y: 0,
            x: 0,
            opacity: 1,
            scale: 1,
            duration: isMobile ? 0.5 : 0.65,
            stagger: 0.16,
            ease: "power3.out",
            scrollTrigger: {
              trigger: ".messages",
              start: "top 82%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }

      /* =========================
         MOVIE CARD FLOAT
      ========================= */

      if (movieCard) {
        gsap.to(movieCard, {
          y: -5,
          duration: 2.2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }

      /* =========================
         MOVIE IMAGE REVEAL
      ========================= */

      if (movieImage) {
        gsap.fromTo(
          movieImage,
          {
            scale: 1.15,
          },
          {
            scale: 1,
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: movieCard,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }

      /* =========================
         INPUT REVEAL
      ========================= */

      if (input) {
        gsap.fromTo(
          input,
          {
            y: 20,
            opacity: 0,
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            delay: 0.3,
            ease: "power3.out",
            scrollTrigger: {
              trigger: wrapper,
              start: "top 65%",
              toggleActions: "play none none reverse",
            },
          }
        );
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
         DESKTOP 3D TILT
      ========================= */

      if (!isMobile && windowElement) {
        const handleMouseMove = (event) => {
          const rect =
            windowElement.getBoundingClientRect();

          const x =
            (event.clientX -
              (rect.left + rect.width / 2)) /
            rect.width;

          const y =
            (event.clientY -
              (rect.top + rect.height / 2)) /
            rect.height;

          gsap.to(windowElement, {
            rotateY: x * 3,
            rotateX: y * -3,
            duration: 0.7,
            ease: "power3.out",
            overwrite: true,
          });
        };

        const handleMouseLeave = () => {
          gsap.to(windowElement, {
            rotateY: 0,
            rotateX: 0,
            duration: 0.6,
            ease: "power3.out",
          });
        };

        windowElement.addEventListener(
          "mousemove",
          handleMouseMove
        );

        windowElement.addEventListener(
          "mouseleave",
          handleMouseLeave
        );

        windowElement._chatMouseMove =
          handleMouseMove;

        windowElement._chatMouseLeave =
          handleMouseLeave;
      }
    }, section);

    return () => {
      const windowElement = section.querySelector(
        ".chat-window"
      );

      if (windowElement?._chatMouseMove) {
        windowElement.removeEventListener(
          "mousemove",
          windowElement._chatMouseMove
        );
      }

      if (windowElement?._chatMouseLeave) {
        windowElement.removeEventListener(
          "mouseleave",
          windowElement._chatMouseLeave
        );
      }

      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-black px-5 py-24 sm:px-8 lg:px-12 lg:py-32"
    >
      <div className="mx-auto max-w-[1300px]">

        {/* Heading */}

        <div className="chat-heading mb-12 text-center">

          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-white/35">
            Stay Connected
          </p>

          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Talk about what you watch.
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-white/40 sm:text-base">
            Send movie recommendations, discuss scenes, and
            chat with friends without leaving CineMate.
          </p>

        </div>

        {/* Chat Wrapper */}

        <div className="chat-wrapper mx-auto max-w-5xl">

          <div className="chat-window grid overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_30px_100px_rgba(0,0,0,0.5)] md:grid-cols-[280px_1fr]">

            {/* ================= SIDEBAR ================= */}

            <aside className="chat-sidebar hidden border-r border-white/10 bg-white/[0.02] md:block">

              {/* Sidebar Header */}

              <div className="flex items-center justify-between border-b border-white/10 p-5">

                <h3 className="font-semibold">
                  Messages
                </h3>

                <button className="text-white/40 transition-colors hover:text-white">
                  <MoreVertical size={18} />
                </button>

              </div>

              {/* Search */}

              <div className="p-4">

                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">

                  <Search
                    size={16}
                    className="text-white/30"
                  />

                  <span className="text-xs text-white/30">
                    Search conversations
                  </span>

                </div>

              </div>

              {/* Conversations */}

              <div>

                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`flex cursor-pointer items-center gap-3 px-4 py-4 transition-colors hover:bg-white/5 ${conversation.active
                        ? "bg-white/5"
                        : ""
                      }`}
                  >

                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-black">

                      {conversation.name.charAt(0)}

                      {conversation.active && (
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-black bg-white" />
                      )}

                    </div>

                    <div className="min-w-0 flex-1">

                      <div className="flex justify-between gap-2">

                        <p className="truncate text-sm font-medium">
                          {conversation.name}
                        </p>

                        <span className="text-[10px] text-white/25">
                          {conversation.time}
                        </span>

                      </div>

                      <p className="mt-1 truncate text-xs text-white/35">
                        {conversation.message}
                      </p>

                    </div>

                  </div>
                ))}

              </div>

            </aside>

            {/* ================= CHAT ================= */}

            <div className="flex min-h-[560px] flex-col">

              {/* Chat Header */}

              <div className="chat-header flex items-center justify-between border-b border-white/10 px-5 py-4">

                <div className="flex items-center gap-3">

                  <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-xs font-bold text-black">

                    R

                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-black bg-white" />

                  </div>

                  <div>

                    <h3 className="text-sm font-semibold">
                      Rahul Sharma
                    </h3>

                    <p className="text-xs text-white/35">
                      Online
                    </p>

                  </div>

                </div>

                <div className="flex items-center gap-1">

                  <button className="rounded-full p-2 text-white/40 transition-all hover:bg-white/5 hover:text-white">
                    <Phone size={18} />
                  </button>

                  <button className="rounded-full p-2 text-white/40 transition-all hover:bg-white/5 hover:text-white">
                    <Video size={19} />
                  </button>

                  <button className="rounded-full p-2 text-white/40 transition-all hover:bg-white/5 hover:text-white">
                    <MoreVertical size={18} />
                  </button>

                </div>

              </div>

              {/* Messages */}

              <div className="messages flex flex-1 flex-col justify-end gap-4 overflow-hidden p-5 sm:p-7">

                {/* Received */}

                <div className="chat-message max-w-[75%] self-start rounded-2xl rounded-bl-md border border-white/10 bg-white/5 px-4 py-3">

                  <p className="text-sm leading-6 text-white/75">
                    Bro, have you watched Dune?
                  </p>

                  <span className="mt-1 block text-right text-[10px] text-white/25">
                    8:40 PM
                  </span>

                </div>

                {/* Sent */}

                <div className="chat-message max-w-[75%] self-end rounded-2xl rounded-br-md bg-white px-4 py-3 text-black">

                  <p className="text-sm leading-6">
                    Not yet. Is it worth watching?
                  </p>

                  <div className="mt-1 flex items-center justify-end gap-1">

                    <span className="text-[10px] opacity-50">
                      8:41 PM
                    </span>

                    <CheckCheck
                      size={13}
                      className="opacity-60"
                    />

                  </div>

                </div>

                {/* Received */}

                <div className="chat-message max-w-[75%] self-start rounded-2xl rounded-bl-md border border-white/10 bg-white/5 px-4 py-3">

                  <p className="text-sm leading-6 text-white/75">
                    Absolutely. The visuals are insane.
                  </p>

                  <span className="mt-1 block text-right text-[10px] text-white/25">
                    8:41 PM
                  </span>

                </div>

                {/* Movie Share */}

                <div className="chat-message chat-movie-card max-w-[290px] self-start overflow-hidden rounded-2xl border border-white/10 bg-white/5">

                  <img
                    src="https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg"
                    alt="Dune"
                    className="chat-movie-image h-36 w-full object-cover"
                  />

                  <div className="p-3">

                    <p className="text-sm font-semibold">
                      Dune
                    </p>

                    <p className="mt-1 text-xs text-white/35">
                      2021 · Sci-Fi
                    </p>

                  </div>

                </div>

              </div>

              {/* Message Input */}

              <div className="chat-input border-t border-white/10 p-4">

                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-2">

                  <input
                    type="text"
                    placeholder="Write a message..."
                    className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-white/25"
                  />

                  <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_5px_25px_rgba(255,255,255,0.2)]">
                    <Send size={16} />
                  </button>

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* CTA */}

        <div className="chat-cta mt-10 text-center">

          <Link
            to="/chat"
            className="group inline-flex rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm text-white/60 transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/10 hover:text-white"
          >
            Start a Conversation

            <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>



        </div>

      </div>
    </section>
  );
};

export default ChatPreview;

