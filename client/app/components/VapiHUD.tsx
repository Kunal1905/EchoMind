"use client";

import { motion, AnimatePresence } from 'motion/react';
import { Mic, Phone } from 'lucide-react';
import { useState } from 'react';
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
  onEndCall, 
  waveformData = [0.3, 0.6, 0.4, 0.8, 0.5, 0.7, 0.3, 0.9, 0.6, 0.4],
  isWaitingForAssistant = false,
  isInitializing = false,
  isSaving = false
}: VapiHUDProps) {
  const [showWaveform, setShowWaveform] = useState(true);
  const prefersReduced = usePrefersReducedMotion();

  const hudTransition = prefersReduced 
    ? { duration: 0 } 
    : { ease: EASES.smooth, duration: DURATIONS.slow };

  return (
    <motion.div
      className="relative z-10"
      initial={prefersReduced ? { opacity: 0 } : { y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={prefersReduced ? { opacity: 0 } : { y: 60, opacity: 0 }}
      transition={hudTransition}
    >
      <div className="bg-black border border-white/15 rounded-3xl px-8 py-6 md:shadow-none">
        <div className="flex flex-col items-center gap-4">
          {/* Waveform visualization */}
          <AnimatePresence>
            {showWaveform && isRecording && (
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
          <div className="flex items-center gap-4">
            {/* Unified Toggle button */}
            <motion.button
              onClick={onToggleRecording}
              disabled={isWaitingForAssistant || isInitializing || isSaving}
              className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isRecording 
                  ? 'bg-red-500' 
                  : 'bg-[--color-electric-iris]'
              } ${(isWaitingForAssistant || isInitializing || isSaving) ? 'opacity-50 cursor-not-allowed' : ''}`}
              whileHover={prefersReduced || isWaitingForAssistant || isInitializing || isSaving ? {} : { scale: 1.1 }}
              whileTap={prefersReduced || isWaitingForAssistant || isInitializing || isSaving ? {} : { scale: 0.95 }}
              transition={{ ease: EASES.smooth, duration: DURATIONS.base }}
              aria-label={isRecording ? 'End call' : 'Start call'}
            >
              {isInitializing || isSaving ? (
                // Show loader when initializing or saving
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : isRecording ? (
                <Phone className="text-white rotate-135" size={28} />
              ) : (
                <Mic className="text-white" size={28} />
              )}
              
              {/* Pulse effect when recording - entirely hidden for reduced motion */}
              {isRecording && !isWaitingForAssistant && !isInitializing && !isSaving && !prefersReduced && (
                <>
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-red-400"
                    animate={{
                      scale: [1, 1.5],
                      opacity: [0.6, 0]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeOut'
                    }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-red-400"
                    animate={{
                      scale: [1, 1.5],
                      opacity: [0.6, 0]
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
