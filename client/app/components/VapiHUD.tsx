"use client";

import { motion, AnimatePresence } from 'motion/react';
import { Mic, Phone } from 'lucide-react';
import { EASES, DURATIONS, usePrefersReducedMotion } from '../lib/motion';

interface VapiHUDProps {
  isRecording: boolean;
  onToggleRecording: () => void;
  onEndCall?: () => void;
  waveformData?: number[];
  isWaitingForAssistant?: boolean;
  isInitializing?: boolean;
  isSaving?: boolean;
}

export function VapiHUD({ 
  isRecording, 
  onToggleRecording, 
  waveformData = [0.3, 0.6, 0.4, 0.8, 0.5, 0.7, 0.3, 0.9, 0.6, 0.4],
  isWaitingForAssistant = false,
  isInitializing = false,
  isSaving = false
}: VapiHUDProps) {
  const prefersReduced = usePrefersReducedMotion();
  const isBusy = isWaitingForAssistant || isInitializing || isSaving;

  const hudTransition = prefersReduced 
    ? { duration: 0 } 
    : { ease: EASES.smooth, duration: DURATIONS.slow };

  const actionLabel = isSaving
    ? "Saving session"
    : isInitializing
    ? "Preparing session"
    : isWaitingForAssistant
    ? "Echo is listening"
    : isRecording
    ? "End session"
    : "Start voice session";

  return (
    <motion.div
      className="relative z-10 w-full"
      initial={prefersReduced ? { opacity: 0 } : { y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={prefersReduced ? { opacity: 0 } : { y: 60, opacity: 0 }}
      transition={hudTransition}
    >
      <div className="mx-auto w-full max-w-sm">
        <div className="flex flex-col items-center gap-5">
          {/* Waveform visualization */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                className="flex items-center gap-1 h-16"
                initial={prefersReduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 64 }}
                exit={prefersReduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
                transition={hudTransition}
              >
                {waveformData.map((height, index) => (
                  <motion.div
                    key={index}
                    className="w-1.5 bg-[--color-electric-iris] rounded-full"
                    animate={{
                      height: isRecording 
                        ? (prefersReduced ? '50%' : `${height * 100}%`) 
                        : '20%'
                    }}
                    transition={prefersReduced ? { duration: 0 } : {
                      duration: 0.3,
                      repeat: Infinity,
                      repeatType: 'reverse',
                      delay: index * 0.1
                    }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Single Control button */}
          <motion.button
            onClick={onToggleRecording}
            disabled={isBusy}
            className={`group relative flex h-28 w-28 items-center justify-center rounded-full border transition-all sm:h-32 sm:w-32 ${
              isRecording
                ? 'border-red-300/70 bg-red-500 text-white shadow-[0_0_48px_rgba(239,68,68,0.45)]'
                : 'border-violet-200/70 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-teal-400 text-white shadow-[0_0_64px_rgba(128,82,255,0.55)]'
            } ${isBusy ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:shadow-[0_0_82px_rgba(128,82,255,0.72)]'}`}
            whileHover={prefersReduced || isBusy ? {} : { scale: 1.06 }}
            whileTap={prefersReduced || isBusy ? {} : { scale: 0.96 }}
            transition={{ ease: EASES.smooth, duration: DURATIONS.base }}
            aria-label={isRecording ? 'End voice session' : 'Start voice session'}
          >
            {!isRecording && !isBusy && !prefersReduced && (
              <>
                <motion.div
                  className="absolute inset-0 rounded-full border border-violet-300/60"
                  animate={{ scale: [1, 1.28], opacity: [0.5, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full border border-teal-200/50"
                  animate={{ scale: [1, 1.42], opacity: [0.35, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut', delay: 0.45 }}
                />
              </>
            )}
            {isInitializing || isSaving ? (
              <div className="h-9 w-9 rounded-full border-[3px] border-white border-t-transparent animate-spin" />
            ) : isRecording ? (
              <Phone className="relative z-10 rotate-135 text-white" size={42} />
            ) : (
              <Mic className="relative z-10 text-white" size={46} />
            )}

            {isRecording && !isBusy && !prefersReduced && (
              <>
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-red-300"
                  animate={{
                    scale: [1, 1.35],
                    opacity: [0.55, 0]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeOut'
                  }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-red-300"
                  animate={{
                    scale: [1, 1.35],
                    opacity: [0.55, 0]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeOut',
                    delay: 0.5
                  }}
                />
              </>
            )}
          </motion.button>

          <div className="text-center">
            <p className="text-base font-semibold text-white">{actionLabel}</p>
            {!isRecording && !isBusy && (
              <p className="mt-1 text-sm text-[--color-ash-gray]">
                Tap the mic to begin talking with Echo.
              </p>
            )}
          </div>

          {/* Status indicator */}
          {(isRecording || isInitializing || isSaving) && (
            <motion.div
              className="flex items-center gap-2 text-sm text-[--color-electric-iris]"
              animate={prefersReduced ? {} : { opacity: [1, 0.6, 1] }}
              transition={prefersReduced ? { duration: 0 } : { duration: 1.5, repeat: Infinity }}
            >
              <div className="w-2 h-2 rounded-full bg-[--color-electric-iris] animate-pulse" />
              <span className="font-medium">
                {isSaving
                  ? "Echo is preserving your session reflections..."
                  : isInitializing
                  ? "Echo is tuning in to your session..."
                  : isWaitingForAssistant 
                  ? "Echo is listening & reflecting..." 
                  : isRecording 
                  ? "Echo is listening — Click to end session" 
                  : ""}
              </span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
