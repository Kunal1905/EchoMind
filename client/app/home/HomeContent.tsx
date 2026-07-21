"use client";

import { motion } from "motion/react";
import { Clock, Crown, Timer, Zap } from "lucide-react";
import { useState } from "react";
import { DisclaimerModal } from "../components/DisclaimerModal";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EASES, DURATIONS, usePrefersReducedMotion } from "../lib/motion";
import ConstellationField from "../components/ConstellationField";

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
  },
  {
    kicker: "Notice",
    title: "Your patterns become visible over time.",
    copy: "EchoMind turns completed sessions into private summaries and optional mood check-ins, helping you see shifts in energy, stress, and recurring themes.",
  },
  {
    kicker: "Return",
    title: "Memory stays under your control.",
    copy: "When you allow it, Echo can reference past summaries so each conversation has context. Turn memory off whenever you want a blank slate.",
  },
];

export default function HomeContent({ onNavigate, isPremium = false, premiumCalls = 0 }: HomeContentProps) {
  const router = useRouter();
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

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

  const reveal = {
    initial: prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 54 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-12% 0px" },
    transition: { duration: prefersReducedMotion ? 0 : DURATIONS.cinematic, ease: EASES.smooth },
  };

  return (
    <div className="void-page pb-20 md:pb-0">
      <section className="relative overflow-hidden pt-24">
        <div className="void-section grid min-h-[calc(100vh-88px)] items-center gap-10 md:grid-cols-[0.95fr_1.05fr]">
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : DURATIONS.cinematic, ease: EASES.smooth }}
            className="relative z-10"
          >
            <div className="void-kicker mb-6">
              Mental wellness companion / {premiumCalls} minute{premiumCalls !== 1 ? "s" : ""} left
            </div>
            <h1 className="void-display max-w-[720px]">
              Give your mind a place to speak.
            </h1>
            <p className="void-copy mt-8 max-w-xl text-white">
              EchoMind is a voice-first AI companion for private emotional reflection, session summaries, and gentle continuity between conversations.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-5">
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
          </motion.div>

          <motion.div
            aria-hidden="true"
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: prefersReducedMotion ? 0 : 1.1, ease: EASES.smooth }}
            className="relative min-h-[320px] overflow-hidden md:min-h-[590px]"
          >
            <ConstellationField density="hero" className="opacity-95" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[58%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
            <p className="absolute bottom-8 left-1/2 w-full max-w-sm -translate-x-1/2 text-center text-sm font-light leading-relaxed text-[--color-ash-gray]">
              A living map of reflection: thoughts, mood check-ins, and summaries forming a calmer memory over time.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="void-section grid gap-12 md:grid-cols-[0.9fr_1.1fr] md:items-end">
        <motion.div {...reveal}>
          <p className="void-kicker mb-5">What changes</p>
          <h2 className="void-heading">Less app noise. More signal from you.</h2>
        </motion.div>
        <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.12 }}>
          <p className="void-copy">
            The interface now keeps the focus on conversation: one primary action, spacious reading rhythm, and ambient constellations that respond as you scroll. The content is chosen around the actual EchoMind workflow: speak, notice, return.
          </p>
        </motion.div>
      </section>

      <section className="void-section space-y-28">
        {storySections.map((section, index) => (
          <motion.div
            key={section.kicker}
            {...reveal}
            transition={{ ...reveal.transition, delay: index * 0.06 }}
            className={`grid gap-8 border-t void-hairline pt-10 md:grid-cols-[0.42fr_0.58fr] md:items-start ${index % 2 ? "md:grid-cols-[0.58fr_0.42fr]" : ""}`}
          >
            <div>
              <p className="text-[88px] font-normal leading-none tracking-[-0.07em] text-white/10 md:text-[132px]">
                0{index + 1}
              </p>
            </div>
            <div>
              <p className="void-kicker mb-5">{section.kicker}</p>
              <h2 className="void-heading">{section.title}</h2>
              <p className="void-copy mt-7 max-w-xl">{section.copy}</p>
            </div>
          </motion.div>
        ))}
      </section>

      <section className="void-section grid gap-10 md:grid-cols-2">
        <motion.div {...reveal}>
          <div className="void-kicker mb-5 flex items-center gap-2">
            <Timer size={14} /> Access
          </div>
          <h2 className="void-subheading mb-5">Start with 5 free minutes.</h2>
          <p className="void-copy">
            Use EchoMind immediately with no card required. Your current balance is {premiumCalls} minute{premiumCalls !== 1 ? "s" : ""}.
          </p>
        </motion.div>
        <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.1 }}>
          <div className="void-kicker mb-5 flex items-center gap-2">
            <Crown size={14} /> Continuity
          </div>
          <h2 className="void-subheading mb-5">Add time when the habit sticks.</h2>
          <p className="void-copy">
            Paid packs extend voice time while keeping session history and mood tracking available for longer reflection cycles.
          </p>
          <button onClick={() => handleNavigation("sessions")} className="void-pill mt-8">
            <Clock size={16} />
            See plans
          </button>
        </motion.div>
      </section>

      <footer className="void-section pt-12">
        <motion.div {...reveal} className="flex flex-col gap-5 border-t void-hairline pt-8 text-sm sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => setDisclaimerOpen(true)}
            className="text-left text-[--color-ash-gray] transition-colors hover:text-white"
          >
            Mental Health Disclaimer
          </button>
          <div className="flex flex-wrap gap-5 text-[--color-ash-gray]">
            <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white">Terms of Use</Link>
            <Link href="/copyright" className="hover:text-white">IP & Copyright</Link>
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
