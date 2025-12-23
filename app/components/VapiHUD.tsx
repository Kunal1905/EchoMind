"use client";

import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Phone } from 'lucide-react';
import { useState } from 'react';

interface VapiHUDProps {
  isRecording: boolean;
  onToggleRecording: () => void;
  onEndCall?: () => void; // Make this optional since we're combining functionality
  waveformData?: number[];
  isWaitingForAssistant?: boolean;
  isInitializing?: boolean;
  isSaving?: boolean; // Add saving state
}

export function VapiHUD({ 
  isRecording, 
  onToggleRecording, 
  onEndCall, // This is now optional
  waveformData = [0.3, 0.6, 0.4, 0.8, 0.5, 0.7, 0.3, 0.9, 0.6, 0.4],
  isWaitingForAssistant = false,
  isInitializing = false,
  isSaving = false // Add saving state
}: VapiHUDProps) {
  const [showWaveform, setShowWaveform] = useState(true);

  return (
    <motion.div
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 sm:static sm:translate-x-0 sm:bottom-0"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
    >
      <div className="backdrop-blur-xl bg-[--bg-darker]/90 border border-violet-500/30 rounded-3xl px-8 py-6 shadow-2xl md:shadow-none">
        <div className="flex flex-col items-center gap-4">
          {/* Waveform visualization */}
          <AnimatePresence>
            {showWaveform && isRecording && (
              <motion.div
                className="flex items-center gap-1 h-16"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 64 }}
                exit={{ opacity: 0, height: 0 }}
              >
                {waveformData.map((height, index) => (
                  <motion.div
                    key={index}
                    className="w-1.5 bg-gradient-to-t from-violet-600 to-teal-400 rounded-full"
                    animate={{
                      height: isRecording ? `${height * 100}%` : '20%'
                    }}
                    transition={{
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
              className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                isRecording 
                  ? 'bg-gradient-to-br from-red-500 to-crimson-600' 
                  : 'bg-gradient-to-br from-violet-600 to-purple-700'
              } ${(isWaitingForAssistant || isInitializing || isSaving) ? 'opacity-50 cursor-not-allowed' : ''}`}
              whileHover={{ scale: (isWaitingForAssistant || isInitializing || isSaving) ? 1 : 1.1 }}
              whileTap={{ scale: (isWaitingForAssistant || isInitializing || isSaving) ? 1 : 0.95 }}
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
              
              {/* Pulse effect when recording */}
              {isRecording && !isWaitingForAssistant && !isInitializing && !isSaving && (
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
              className="flex items-center gap-2 text-sm text-red-400"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span>
                {isSaving
                  ? "Saving session..."
                  : isInitializing
                  ? "Initializing..."
                  : isWaitingForAssistant 
                  ? "Waiting for assistant..." 
                  : isRecording 
                  ? "Recording - Click to end" 
                  : ""}
              </span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
