
import { useLayoutEffect, useRef } from "react";
import {
  ArrowUpRight,
  MessageCircle,
  Search,
  Smartphone,
  Tv,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "react-router-dom";

gsap.registerPlugin(ScrollTrigger);

const WhatsAppDiscovery = () => {
  const sectionRef = useRef(null);

  useLayoutEffect(() => {
    if (!sectionRef.current) {
      return;
    }

    const section = sectionRef.current;

    const ctx = gsap.context(() => {
      const container = section.querySelector(
        ".whatsapp-container"
      );

      const visual = section.querySelector(
        ".whatsapp-visual"
      );

      const content = section.querySelector(
        ".whatsapp-content"
      );

      const phone = section.querySelector(
        ".whatsapp-phone"
      );

      const userMessage = section.querySelector(
        ".whatsapp-user-message"
      );

      const cineMateMessage = section.querySelector(
        ".whatsapp-response"
      );

      const deviceCards = section.querySelectorAll(
        ".whatsapp-device"
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
         CONTENT REVEAL
      ========================= */

      if (content) {
        gsap.fromTo(
          content.children,
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
      }

      /* =========================
         VISUAL REVEAL
      ========================= */

      gsap.fromTo(
        visual,
        {
          x: isMobile ? 0 : -70,
          y: isMobile ? 25 : 0,
          opacity: 0,
          rotateY: isMobile ? 0 : -8,
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
         PHONE FLOAT
      ========================= */

      if (phone) {
        gsap.to(phone, {
          y: -8,
          duration: 2.4,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }

      /* =========================
         USER MESSAGE
      ========================= */

      if (userMessage) {
        gsap.fromTo(
          userMessage,
          {
            x: 20,
            opacity: 0,
          },
          {
            x: 0,
            opacity: 1,
            duration: 0.6,
            delay: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: container,
              start: "top 70%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }

      /* =========================
         CINEMATE RESPONSE
      ========================= */

      if (cineMateMessage) {
        gsap.fromTo(
          cineMateMessage,
          {
            x: -20,
            opacity: 0,
          },
          {
            x: 0,
            opacity: 1,
            duration: 0.6,
            delay: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: container,
              start: "top 70%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }

      /* =========================
         DEVICE CARDS
      ========================= */

      if (deviceCards.length) {
        gsap.fromTo(
          deviceCards,
          {
            y: 20,
            opacity: 0,
            scale: 0.95,
          },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.6,
            stagger: 0.12,
            delay: 0.25,
            ease: "power3.out",
            scrollTrigger: {
              trigger: container,
              start: "top 70%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }

      /* =========================
         DESKTOP 3D PARALLAX
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

        visual._whatsappMouseMove = handleMouseMove;
        visual._whatsappMouseLeave = handleMouseLeave;
      }
    }, section);


    return () => {
      const visual = section.querySelector(
        ".whatsapp-visual"
      );

      if (visual?._whatsappMouseMove) {
        visual.removeEventListener(
          "mousemove",
          visual._whatsappMouseMove
        );
      }

      if (visual?._whatsappMouseLeave) {
        visual.removeEventListener(
          "mouseleave",
          visual._whatsappMouseLeave
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
      <div className="mx-auto max-w-[1600px]">

        <div className="whatsapp-container grid items-center gap-12 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md sm:p-10 lg:grid-cols-2 lg:p-14">

          {/* Visual */}

          <div className="whatsapp-visual relative order-2 [perspective:1000px] lg:order-1">

            <div className="whatsapp-phone mx-auto max-w-md rounded-[2rem] border border-white/10 bg-black/70 p-5 shadow-2xl">

              {/* Phone */}

              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">

                <div className="flex items-center gap-3 border-b border-white/10 pb-4">

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black">
                    <MessageCircle size={20} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      CineMate
                    </p>

                    <p className="text-xs text-white/30">
                      Entertainment Assistant
                    </p>
                  </div>

                </div>

                {/* User message */}

                <div className="whatsapp-user-message mt-6 flex justify-end">

                  <div className="max-w-[80%] rounded-2xl rounded-br-md bg-white px-4 py-3 text-sm text-black">
                    Show me some action movies
                  </div>

                </div>

                {/* CineMate response */}

                <div className="whatsapp-response mt-4 flex gap-3">

                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10">
                    <Search size={14} />
                  </div>

                  <div className="rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.05] px-4 py-3">

                    <p className="text-sm font-medium">
                      Finding action movies...
                    </p>

                    <p className="mt-1 text-xs text-white/35">
                      Results are ready on your connected device.
                    </p>

                  </div>

                </div>

              </div>

              {/* Connected devices */}

              <div className="mt-4 grid grid-cols-2 gap-3">

                <div className="whatsapp-device rounded-2xl border border-white/10 bg-white/[0.03] p-4">

                  <Tv
                    size={18}
                    className="text-white/60"
                  />

                  <p className="mt-3 text-xs font-medium">
                    Living Room TV
                  </p>

                  <p className="mt-1 text-[10px] text-white/30">
                    Connected
                  </p>

                </div>

                <div className="whatsapp-device rounded-2xl border border-white/10 bg-white/[0.03] p-4">

                  <Smartphone
                    size={18}
                    className="text-white/60"
                  />

                  <p className="mt-3 text-xs font-medium">
                    Your Phone
                  </p>

                  <p className="mt-1 text-[10px] text-white/30">
                    Controller
                  </p>

                </div>

              </div>

            </div>

          </div>

          {/* Content */}

          <div className="whatsapp-content order-1 lg:order-2">

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.15em] text-white/50">

              <MessageCircle size={14} />

              WhatsApp Discovery

            </div>

            <h2 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">

              Search from

              <span className="block text-white/35">
                WhatsApp.
              </span>

            </h2>

            <p className="mt-6 max-w-xl text-base leading-7 text-white/45 sm:text-lg">
              Tell CineMate what you want to watch through WhatsApp.
              Your search can appear directly on your connected TV,
              laptop or other supported device.
            </p>


            <Link
              to="/chat"
              className="group mt-8 inline-flex items-center gap-3 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(255,255,255,0.15)]"
            >
              Connect WhatsApp

              <ArrowUpRight
                size={17}
                className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
              />
            </Link>



          </div>

        </div>

      </div>
    </section>
  );
};

export default WhatsAppDiscovery;

