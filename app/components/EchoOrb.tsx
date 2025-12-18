"use client";
import { motion } from 'motion/react';
import { useState } from 'react';

interface EchoOrbProps {
  sentiment?: 'neutral' | 'negative' | 'positive';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isPulsing?: boolean;
  isRecording?: boolean;
  onClick?: () => void;
  draggable?: boolean;
}

export function EchoOrb({ 
  sentiment = 'neutral', 
  size = 'md',
  isPulsing = false,
  isRecording = false,
  onClick,
  draggable = false
}: EchoOrbProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48'
  };

  const sentimentColors = {
    neutral: 'from-violet-500 via-purple-500 to-violet-600',
    negative: 'from-red-500 via-rose-500 to-crimson-600',
    positive: 'from-emerald-400 via-teal-500 to-cyan-500'
  };

  const pulseSpeed = sentiment === 'negative' ? 1.5 : sentiment === 'positive' ? 0.8 : 1.2;

  return (
    <motion.div
      drag={draggable}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDragEnd={(_, info) => {
        setPosition({ x: info.offset.x, y: info.offset.y });
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`${sizeClasses[size]} relative cursor-pointer`}
      role="button"
      aria-label={`Echo orb with ${sentiment} sentiment`}
      tabIndex={0}
    >
      {/* Outer glow rings */}
      {isPulsing && (
        <>
          <motion.div
            className={`absolute inset-0 rounded-full bg-gradient-to-br ${sentimentColors[sentiment]} opacity-40 blur-xl`}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.4, 0.6, 0.4]
            }}
            transition={{
              duration: pulseSpeed,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className={`absolute inset-0 rounded-full bg-gradient-to-br ${sentimentColors[sentiment]} opacity-30 blur-2xl`}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{
              duration: pulseSpeed * 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </>
      )}

      {/* Recording wave effect */}
      {isRecording && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-white opacity-60"
            animate={{
              scale: [1, 2],
              opacity: [0.6, 0]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-white opacity-60"
            animate={{
              scale: [1, 2],
              opacity: [0.6, 0]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut",
              delay: 0.5
            }}
          />
        </>
      )}

      {/* Core orb */}
      <motion.div
        className={`relative w-full h-full rounded-full bg-gradient-to-br ${sentimentColors[sentiment]}`}
        animate={isPulsing ? {
          scale: [1, 1.05, 1],
        } : {}}
        transition={{
          duration: pulseSpeed,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {/* Inner shine */}
        <div className="absolute top-2 left-2 w-1/3 h-1/3 rounded-full bg-white opacity-40 blur-md" />
        
        {/* Rotating particles */}
        <motion.div
          className="absolute inset-2 rounded-full border border-white/20"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>
    </motion.div>
  );
}
