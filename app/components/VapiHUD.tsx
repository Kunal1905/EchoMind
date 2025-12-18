"use client";

import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Phone } from 'lucide-react';
import { useState } from 'react';

interface VapiHUDProps {
  isRecording: boolean;
  onToggleRecording: () => void;
  onEndCall: () => void;
  waveformData?: number[];
}

export function VapiHUD({ 
  isRecording, 
  onToggleRecording, 
  onEndCall,
  waveformData = [0.3, 0.6, 0.4, 0.8, 0.5, 0.7, 0.3, 0.9, 0.6, 0.4]
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

          {/* Control buttons */}
          <div className="flex items-center gap-4">
            {/* Mic toggle button */}
            <motion.button
              onClick={onToggleRecording}
              className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                isRecording 
                  ? 'bg-gradient-to-br from-red-500 to-crimson-600' 
                  : 'bg-gradient-to-br from-violet-600 to-purple-700'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              aria-label={isRecording ? 'Mute microphone' : 'Unmute microphone'}
            >
              {isRecording ? (
                <Mic className="text-white" size={28} />
              ) : (
                <MicOff className="text-white" size={28} />
              )}
              
              {/* Pulse effect when recording */}
              {isRecording && (
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

            {/* End call button */}
            <motion.button
              onClick={onEndCall}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center glitch-hover"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              aria-label="End call"
            >
              <Phone className="text-white rotate-135" size={28} />
            </motion.button>
          </div>

          {/* Recording indicator */}
          {isRecording && (
            <motion.div
              className="flex items-center gap-2 text-sm text-red-400"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span>Recording</span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}