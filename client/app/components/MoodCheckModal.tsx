import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import api from "@/app/lib/api";
import { EASES, DURATIONS, usePrefersReducedMotion } from "../lib/motion";

const MOOD_OPTIONS: { label: string; emoji: string; score: number }[] = [
  { label: "Struggling", emoji: "😔", score: 2 },
  { label: "Low", emoji: "😕", score: 4 },
  { label: "Okay", emoji: "😐", score: 6 },
  { label: "Good", emoji: "🙂", score: 8 },
  { label: "Great", emoji: "😄", score: 10 },
];

interface MoodCheckModalProps {
  isOpen: boolean;
  sessionId: string;
  onDone: () => void;
}

export function MoodCheckModal({ isOpen, sessionId, onDone }: MoodCheckModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const prefersReduced = usePrefersReducedMotion();

  const submitMood = async (score: number) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.post("/mood", { sessionId, moodScore: score });
    } catch (e) {
      // Non-fatal — mood check-in is a nice-to-have, never blocks navigation
      console.error("Failed to save mood entry", e);
    } finally {
      setIsSubmitting(false);
      onDone();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 animate-duration-fast"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: prefersReduced ? DURATIONS.instant : DURATIONS.base,
              ease: EASES.smooth
            }}
            onClick={onDone}
          />

          {/* Modal */}
          <motion.div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-black border border-white/15 rounded-2xl p-6 z-50 text-white"
            initial={prefersReduced ? { opacity: 0 } : { scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={prefersReduced ? { opacity: 0 } : { scale: 0.95, opacity: 0 }}
            transition={{
              duration: prefersReduced ? DURATIONS.instant : DURATIONS.slow,
              ease: EASES.smooth
            }}
            role="dialog"
            aria-labelledby="mood-check-title"
            aria-describedby="mood-check-description"
          >
            <h3
              id="mood-check-title"
              className="void-subheading mb-2 text-center"
            >
              How are you feeling now?
            </h3>
            <p id="mood-check-description" className="text-center text-sm text-gray-400 mb-6">
              A quick check-in — this helps Echo notice how things are trending for you over time.
            </p>

            <div className="flex justify-between gap-2 mb-6">
              {MOOD_OPTIONS.map((opt) => (
                <motion.button
                  key={opt.score}
                  onClick={() => submitMood(opt.score)}
                  disabled={isSubmitting}
                  aria-label={opt.label}
                  className="flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border border-white/15 bg-transparent hover:border-[--color-electric-iris] transition-colors disabled:opacity-50 cursor-pointer"
                  whileHover={prefersReduced ? {} : { scale: 1.05 }}
                  whileTap={prefersReduced ? {} : { scale: 0.95 }}
                  transition={{ ease: EASES.smooth, duration: DURATIONS.fast }}
                >
                  <span className="text-2xl" aria-hidden="true">{opt.emoji}</span>
                  <span className="text-[11px] text-gray-400">{opt.label}</span>
                </motion.button>
              ))}
            </div>

            <button
              onClick={onDone}
              disabled={isSubmitting}
              className="w-full px-6 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors text-center disabled:opacity-50 cursor-pointer"
            >
              Skip
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
