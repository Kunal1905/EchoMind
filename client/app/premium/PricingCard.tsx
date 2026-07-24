"use client";

import React, { useState, useCallback } from "react";
import { Check } from "lucide-react";
import { motion, useMotionValue, useMotionTemplate } from "motion/react";

interface PricingCardProps {
  title: string;
  price: string;
  minutes: number;
  icon: React.ReactNode;
  accent: string;       // e.g. "#8052ff"
  accentRgb: string;    // e.g. "128, 82, 255"
  badge?: string;       // e.g. "🔥 MOST POPULAR"
  featured?: boolean;   // featured gets scale-105 hover and float
  features: string[];
  isCurrentPlan: boolean;
  onUpgrade: () => void;
  index: number;        // staggered entrance
}

const noiseBg = "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E";

export default function PricingCard({
  title,
  price,
  minutes,
  icon,
  accent,
  accentRgb,
  badge,
  featured = false,
  features,
  isCurrentPlan,
  onUpgrade,
  index,
}: PricingCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.98 }}
      whileInView={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        transition: {
          delay: index * 0.1,
          type: "spring",
          stiffness: 100,
          damping: 15
        }
      }}
      viewport={{ once: true, margin: "-10% 0px" }}
      animate={
        isHovered
          ? { 
              y: -8, 
              scale: featured ? 1.05 : 1.02,
              boxShadow: featured 
                ? "0 25px 50px -12px rgba(128, 82, 255, 0.25)" 
                : `0 20px 40px -12px rgba(${accentRgb}, 0.15)`
            }
          : featured
          ? { 
              y: [0, -6, 0],
              scale: 1,
              boxShadow: "0 10px 30px -10px rgba(128, 82, 255, 0.1)"
            }
          : { 
              y: 0,
              scale: 1,
              boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.5)"
            }
      }
      transition={
        isHovered
          ? { type: "spring", stiffness: 350, damping: 20 }
          : featured
          ? { 
              y: { 
                repeat: Infinity, 
                duration: 5, 
                ease: "easeInOut" 
              },
              scale: { type: "spring", stiffness: 200, damping: 25 },
              boxShadow: { duration: 0.5 }
            }
          : { type: "spring", stiffness: 200, damping: 25 }
      }
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative rounded-3xl p-[1.5px] flex flex-col h-full overflow-hidden"
      style={{
        background: `rgba(255, 255, 255, ${featured ? "0.08" : "0.03"})`,
      }}
    >
      {/* Animated Border Beam */}
      <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none z-0">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180%] h-[180%] aspect-square"
          style={{
            background: `conic-gradient(from 0deg, transparent 40%, ${accent} 70%, transparent 100%)`,
          }}
          animate={{ rotate: 360 }}
          transition={{
            repeat: Infinity,
            duration: featured ? 8 : 12,
            ease: "linear",
          }}
        />
      </div>

      {/* Glassmorphism Inner Content Container */}
      <div 
        className="relative z-10 w-full h-full rounded-[23px] bg-neutral-950/90 backdrop-blur-2xl flex flex-col p-6 sm:p-8 md:p-10 justify-between overflow-hidden flex-grow border border-white/5"
      >
        {/* Background blobs, grid & noise inside */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-[23px]">
          {/* Accent Blobs */}
          <div 
            className="absolute -top-24 -left-24 w-48 h-48 rounded-full blur-[80px] transition-opacity duration-300"
            style={{ 
              backgroundColor: accent, 
              opacity: isHovered ? 0.15 : 0.08 
            }}
          />
          <div 
            className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full blur-[80px] transition-opacity duration-300"
            style={{ 
              backgroundColor: accent, 
              opacity: isHovered ? 0.12 : 0.06 
            }}
          />
          {/* Grid Pattern */}
          <div 
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            }}
          />
          {/* Noise Texture */}
          <div 
            className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
            style={{
              backgroundImage: `url("${noiseBg}")`,
            }}
          />
        </div>

        {/* Spotlight Effect (follows mouse) */}
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-[23px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
          style={{
            background: useMotionTemplate`radial-gradient(320px circle at ${mouseX}px ${mouseY}px, rgba(${accentRgb}, 0.12), transparent 80%)`,
          }}
        />

        {/* Content wrapper */}
        <div className="relative z-20 flex flex-col flex-grow">
          {/* Top Row: Icon Section & Badge */}
          <div className="flex items-start justify-between mb-6">
            {/* Top Icon Circular Container */}
            <div className="relative flex-shrink-0">
              <div 
                className="absolute inset-0 rounded-full blur-md opacity-30 scale-125"
                style={{
                  background: `radial-gradient(circle, ${accent} 0%, transparent 70%)`
                }}
              />
              <motion.div 
                className="relative flex h-14 w-14 items-center justify-center rounded-full border border-white/10"
                style={{
                  background: `linear-gradient(135deg, ${accent}15 0%, ${accent}02 100%)`
                }}
                animate={isHovered ? { rotate: 15, scale: 1.05 } : { rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, {
                  className: "w-6 h-6",
                  style: { color: accent }
                }) : icon}
              </motion.div>
            </div>

            {/* Top Right Badge */}
            {badge && (
              <div className="z-30">
                <span 
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border"
                  style={{
                    backgroundColor: `${accent}15`,
                    color: '#ffffff',
                    borderColor: `${accent}35`,
                    boxShadow: `0 0 15px ${accent}20`
                  }}
                >
                  {badge}
                </span>
              </div>
            )}
          </div>

          {/* Plan Title */}
          <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
            {title}
          </h2>

          {/* Minutes Badge Capsule */}
          <div 
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md self-start border mb-6"
            style={{
              backgroundColor: `${accent}15`,
              borderColor: `${accent}25`,
              color: accent,
            }}
          >
            {minutes} Minutes
          </div>

          {/* Pricing display */}
          <div className="mb-6 flex flex-col">
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-light tracking-tighter text-white">
                {price}
              </span>
            </div>
            <span className="mt-1 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
              One-time purchase
            </span>
          </div>

          {/* Feature list */}
          <ul className="mb-8 space-y-4 text-sm text-neutral-300 flex-grow">
            {features.map((feature, featureIndex) => (
              <li key={feature} className="flex items-start gap-3">
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                    delay: 0.1 * featureIndex + 0.1
                  }}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/5 border border-white/10 mt-0.5"
                >
                  <Check className="w-3 h-3" style={{ color: accent }} />
                </motion.div>
                <span className="leading-relaxed">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Upgrade Button or Current Plan Status */}
        <div className="relative z-20 mt-auto pt-4">
          {isCurrentPlan ? (
            <button
              disabled
              className="w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.08)] cursor-not-allowed"
            >
              Current Plan
              <Check className="w-4 h-4 text-emerald-400" />
            </button>
          ) : (
            <motion.button
              onClick={onUpgrade}
              className="w-full relative overflow-hidden py-4 rounded-xl font-extrabold text-sm tracking-wider text-white transition-all duration-300 flex items-center justify-center gap-2"
              style={{
                background: `linear-gradient(135deg, ${accent}cc 0%, ${accent} 100%)`,
              }}
              whileHover="hover"
              variants={{
                hover: {
                  scale: 1.02,
                  y: -2,
                  boxShadow: `0 10px 30px rgba(${accentRgb}, 0.45)`,
                }
              }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Shimmer Effect */}
              <motion.span
                className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
                initial={{ x: "-100%" }}
                variants={{
                  hover: {
                    x: "100%",
                    transition: { repeat: Infinity, duration: 1.5, ease: "linear" }
                  }
                }}
              />
              Add {minutes} minutes
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
