"use client";

import { motion, useInView } from "motion/react";
import { Clock, Crown, Timer, Zap } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { DisclaimerModal } from "../components/DisclaimerModal";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EASES, DURATIONS, usePrefersReducedMotion } from "../lib/motion";
import ConstellationField from "../components/ConstellationField";
import AmbientParallax from "../components/AmbientParallax";
import {
  useParallax,
  usePinnedTimeline,
  useHeroEntrance,
  splitWords,
  refreshScrollTriggers,
} from "../lib/useScrollAnimations";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface HomeContentProps {
  onNavigate?: (page: string) => void;
  isPremium?: boolean;
  premiumCalls?: number;
}

const storySections = [
  {
    kicker: "Speak",
    title: "A voice space that does not rush you.",
    copy: "Start a guided Echo session, choose the language that feels natural, and talk through what is on your mind without building a perfect prompt first.",
    accentColor: "var(--color-saffron-spark)",
  },
  {
    kicker: "Notice",
    title: "Your patterns become visible over time.",
    copy: "EchoMind turns completed sessions into private summaries and optional mood check-ins, helping you see shifts in energy, stress, and recurring themes.",
    accentColor: "var(--color-electric-iris)",
  },
  {
    kicker: "Return",
    title: "Memory stays under your control.",
    copy: "When you allow it, Echo can reference past summaries so each conversation has context. Turn memory off whenever you want a blank slate.",
    accentColor: "var(--color-deep-verdant)",
  },
];

// ─── Enhanced scroll-reveal variants ─────────────────────────────────────────

const containerReveal = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const childReveal = {
  hidden: { opacity: 0, y: 36, filter: "blur(6px)", scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    scale: 1,
    transition: {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
};

const childRevealMobile = {
  hidden: { opacity: 0, y: 20, filter: "blur(3px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.55,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
};

// ─── Pinned Story Cards (Desktop) ──────────────────────────────────────────

function PinnedStories({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  const { containerRef, getTimeline } = usePinnedTimeline({
    scrub: 0.8,
    pinnedSpacing: "+=250%",
  });
  const cardsRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;

    const isMobile = window.innerWidth < 768;
    if (isMobile) return;

    // Wait for the pinned timeline to be created
    const checkInterval = setInterval(() => {
      const tl = getTimeline();
      if (!tl || !cardsRef.current) return;
      clearInterval(checkInterval);

      const cards = cardsRef.current.querySelectorAll<HTMLElement>(".story-card-item");
      const numberEls = cardsRef.current.querySelectorAll<HTMLElement>(".story-number");
      const dots = cardsRef.current.querySelectorAll<HTMLElement>(".progress-dot");

      if (cards.length !== 3) return;

      // First card starts visible
      gsap.set(cards[0], { opacity: 1, y: 0 });
      gsap.set(numberEls[0], { opacity: 1 });

      // Card 1 → Card 2 transition
      tl.to(
        cards[0],
        { opacity: 0, y: -60, duration: 0.4 },
        0.3
      )
        .fromTo(
          cards[1],
          { opacity: 0, y: 60 },
          { opacity: 1, y: 0, duration: 0.4 },
          0.35
        )
        .to(dots[0], { scale: 1, background: "var(--color-ash-gray)", duration: 0.1 }, 0.3)
        .to(dots[1], { scale: 1.3, background: "var(--color-electric-iris)", duration: 0.1 }, 0.35)

        // Card 2 → Card 3 transition
        .to(
          cards[1],
          { opacity: 0, y: -60, duration: 0.4 },
          0.65
        )
        .fromTo(
          cards[2],
          { opacity: 0, y: 60 },
          { opacity: 1, y: 0, duration: 0.4 },
          0.7
        )
        .to(dots[1], { scale: 1, background: "var(--color-ash-gray)", duration: 0.1 }, 0.65)
        .to(dots[2], { scale: 1.3, background: "var(--color-electric-iris)", duration: 0.1 }, 0.7);

      // Track active index via scroll progress
      tl.eventCallback("onUpdate", () => {
        const progress = tl.progress();
        if (progress < 0.33) setActiveIndex(0);
        else if (progress < 0.66) setActiveIndex(1);
        else setActiveIndex(2);
      });
    }, 100);

    return () => clearInterval(checkInterval);
  }, [getTimeline, prefersReducedMotion]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen"
    >
      <div ref={cardsRef} className="void-section relative h-screen flex flex-col justify-center">
        {/* Progress dots */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-10">
          {storySections.map((_, i) => (
            <div
              key={i}
              className={`progress-dot scroll-progress-dot ${i === 0 ? "is-active" : ""}`}
            />
          ))}
        </div>

        {/* Story cards */}
        <div className="relative" style={{ minHeight: "400px" }}>
          {storySections.map((section, index) => (
            <div
              key={section.kicker}
              className={`story-card-item ${index === 0 ? "" : "absolute inset-0"}`}
              style={{
                opacity: index === 0 ? 1 : 0,
                position: index === 0 ? "relative" : "absolute",
              }}
            >
              <div
                className={`grid gap-8 border-t void-hairline pt-10 md:grid-cols-[0.42fr_0.58fr] md:items-start ${
                  index % 2 ? "md:grid-cols-[0.58fr_0.42fr]" : ""
                }`}
              >
                <div>
                  <p className="story-number text-[88px] font-normal leading-none tracking-[-0.07em] text-white/10 md:text-[132px]">
                    0{index + 1}
                  </p>
                </div>
                <div>
                  <p
                    className="void-kicker mb-5"
                    style={{ color: section.accentColor }}
                  >
                    {section.kicker}
                  </p>
                  <h2 className="void-heading">{section.title}</h2>
                  <p className="void-copy mt-7 max-w-xl">{section.copy}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Mobile Story Cards (Staggered reveals, no pinning) ─────────────────────

function MobileStories() {
  const prefersReducedMotion = usePrefersReducedMotion();

  const mobileReveal = {
    initial: prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: 40, filter: "blur(4px)" },
    whileInView: { opacity: 1, x: 0, filter: "blur(0px)" },
    viewport: { once: true, margin: "-10% 0px" },
    transition: {
      duration: prefersReducedMotion ? 0 : 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  };

  return (
    <section className="void-section space-y-28">
      {storySections.map((section, index) => (
        <motion.div
          key={section.kicker}
          {...mobileReveal}
          transition={{
            ...(mobileReveal.transition as object),
            delay: index * 0.06,
          }}
          className={`grid gap-8 border-t void-hairline pt-10 md:grid-cols-[0.42fr_0.58fr] md:items-start ${
            index % 2 ? "md:grid-cols-[0.58fr_0.42fr]" : ""
          }`}
        >
          <div>
            <p className="text-[88px] font-normal leading-none tracking-[-0.07em] text-white/10 md:text-[132px]">
              0{index + 1}
            </p>
          </div>
          <div>
            <p
              className="void-kicker mb-5"
              style={{ color: section.accentColor }}
            >
              {section.kicker}
            </p>
            <h2 className="void-heading">{section.title}</h2>
            <p className="void-copy mt-7 max-w-xl">{section.copy}</p>
          </div>
        </motion.div>
      ))}
    </section>
  );
}

// ─── Desktop/Mobile detector ────────────────────────────────────────────────

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile;
}

// ─── Main HomeContent ───────────────────────────────────────────────────────

export default function HomeContent({
  onNavigate,
  isPremium = false,
  premiumCalls = 0,
}: HomeContentProps) {
  const router = useRouter();
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();

  // Hero entrance animation (GSAP)
  const { headlineRef, bodyRef, ctaRef } = useHeroEntrance();

  // Parallax refs for hero elements
  const headlineParallaxRef = useParallax(0.85, { mobileSpeed: 0.95 });
  const constellationParallaxRef = useParallax(0.5, { mobileSpeed: 0.8 });

  const handleNavigation = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
      return;
    }

    switch (page) {
      case "chat":
        router.push("/echo/new");
        break;
      case "sessions":
        router.push("/premium");
        break;
      default:
        router.push(`/${page}`);
    }
  };

  // Refresh ScrollTrigger on mount
  useEffect(() => {
    const timer = setTimeout(() => refreshScrollTriggers(), 200);
    return () => clearTimeout(timer);
  }, []);

  // Enhanced reveal for Framer Motion sections
  const reveal = {
    initial: prefersReducedMotion
      ? { opacity: 1 }
      : { opacity: 0, y: isMobile ? 24 : 54, filter: isMobile ? "blur(3px)" : "blur(6px)", scale: 0.97 },
    whileInView: { opacity: 1, y: 0, filter: "blur(0px)", scale: 1 },
    viewport: { once: true, margin: "-12% 0px" },
    transition: {
      duration: prefersReducedMotion ? 0 : isMobile ? 0.5 : DURATIONS.cinematic,
      ease: EASES.smooth,
    },
  };

  return (
    <div className="void-page pb-20 md:pb-0">
      {/* Ambient parallax background layer */}
      <AmbientParallax />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  HERO SECTION                                                      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-24">
        <div className="void-section grid min-h-[calc(100vh-88px)] items-center gap-10 md:grid-cols-[0.95fr_1.05fr]">
          {/* Hero text column */}
          <div className="relative z-10" ref={headlineParallaxRef}>
            {/* Kicker — simple opacity/y animation */}
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.5,
                ease: EASES.expoOut,
                delay: 0.05,
              }}
              className="void-kicker mb-6"
            >
              Mental wellness companion / {premiumCalls} minute
              {premiumCalls !== 1 ? "s" : ""} left
            </motion.div>

            {/* Headline with word-split animation */}
            <h1 ref={headlineRef} className="void-display max-w-[720px] word-split">
              {splitWords("Give your mind a place to speak.")}
            </h1>

            {/* Body copy */}
            <div ref={bodyRef}>
              <p className="void-copy mt-8 max-w-xl text-white">
                EchoMind is a voice-first AI companion for private emotional
                reflection, session summaries, and gentle continuity between
                conversations.
              </p>
            </div>

            {/* CTA buttons */}
            <div ref={ctaRef} className="mt-10 flex flex-wrap items-center gap-5">
              <button
                onClick={() => handleNavigation("chat")}
                className="void-pill"
              >
                <Zap size={16} />
                Start session
              </button>
              <button
                onClick={() => handleNavigation("history")}
                className="void-ghost"
              >
                View history
              </button>
            </div>
          </div>

          {/* Constellation visualization with parallax */}
          <motion.div
            aria-hidden="true"
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 1.1,
              ease: EASES.smooth,
            }}
            className="relative min-h-[320px] overflow-hidden md:min-h-[590px]"
            ref={constellationParallaxRef}
          >
            <ConstellationField density="hero" className="opacity-95" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[58%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
            <p className="absolute bottom-8 left-1/2 w-full max-w-sm -translate-x-1/2 text-center text-sm font-light leading-relaxed text-[--color-ash-gray]">
              A living map of reflection: thoughts, mood check-ins, and
              summaries forming a calmer memory over time.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  "WHAT CHANGES" SECTION — Two-column with staggered reveals       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="void-section">
        <motion.div
          variants={containerReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-12% 0px" }}
          className="grid gap-12 md:grid-cols-[0.9fr_1.1fr] md:items-end"
        >
          <motion.div variants={isMobile ? childRevealMobile : childReveal}>
            <p className="void-kicker mb-5">What changes</p>
            <h2 className="void-heading">Less app noise. More signal from you.</h2>
          </motion.div>
          <motion.div variants={isMobile ? childRevealMobile : childReveal}>
            <p className="void-copy">
              The interface now keeps the focus on conversation: one primary
              action, spacious reading rhythm, and ambient constellations that
              respond as you scroll. The content is chosen around the actual
              EchoMind workflow: speak, notice, return.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  STORY SECTIONS — Pinned on desktop, stagger on mobile            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {isMobile ? (
        <MobileStories />
      ) : (
        <PinnedStories onNavigate={handleNavigation} />
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  ACCESS & CONTINUITY — Two-column staggered reveal                */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="void-section">
        <motion.div
          variants={containerReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-12% 0px" }}
          className="grid gap-10 md:grid-cols-2"
        >
          <motion.div variants={isMobile ? childRevealMobile : childReveal}>
            <div className="void-kicker mb-5 flex items-center gap-2">
              <Timer size={14} /> Access
            </div>
            <h2 className="void-subheading mb-5">Start with 10 free minutes each month.</h2>
            <p className="void-copy">
              Use EchoMind immediately with no card required. Your current
              balance is {premiumCalls} minute{premiumCalls !== 1 ? "s" : ""}.
            </p>
          </motion.div>
          <motion.div variants={isMobile ? childRevealMobile : childReveal}>
            <div className="void-kicker mb-5 flex items-center gap-2">
              <Crown size={14} /> Continuity
            </div>
            <h2 className="void-subheading mb-5">
              Add time when the habit sticks.
            </h2>
            <p className="void-copy">
              Monthly plans extend voice time while keeping session history and mood
              tracking available for longer reflection cycles.
            </p>
            <button
              onClick={() => handleNavigation("sessions")}
              className="void-pill mt-8"
            >
              <Clock size={16} />
              See plans
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  FOOTER                                                            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <footer className="void-section pt-12">
        <motion.div
          {...reveal}
          className="flex flex-col gap-5 border-t void-hairline pt-8 text-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <button
            onClick={() => setDisclaimerOpen(true)}
            className="text-left text-[--color-ash-gray] transition-colors hover:text-white"
          >
            Mental Health Disclaimer
          </button>
          <div className="flex flex-wrap gap-5 text-[--color-ash-gray]">
            <Link href="/privacy" className="hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white">
              Terms of Use
            </Link>
            <Link href="/copyright" className="hover:text-white">
              IP &amp; Copyright
            </Link>
          </div>
        </motion.div>
      </footer>

      <DisclaimerModal
        isOpen={disclaimerOpen}
        onClose={() => setDisclaimerOpen(false)}
      />
    </div>
  );
}
