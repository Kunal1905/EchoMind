"use client";

import { useEffect, useState } from "react";

// Centralized Framer Motion easing curves aligned with our CSS tokens
export const EASES = {
  // Cubic Beziers
  smooth: [0.25, 0.46, 0.45, 0.94],     // --ease-smooth
  expoOut: [0.16, 1, 0.3, 1],          // --ease-expo-out
  circOut: [0.075, 0.82, 0.165, 1],    // --ease-circ-out
  sharp: [0.4, 0, 0.2, 1],             // --ease-sharp
  
  // Spring configurations (as objects for transition properties)
  spring: {
    type: "spring",
    stiffness: 300,
    damping: 30,
  },
  gentleSpring: {
    type: "spring",
    stiffness: 150,
    damping: 25,
  },
  breathe: {
    repeat: Infinity,
    repeatType: "reverse" as const,
    duration: 4,
    ease: [0.25, 0.46, 0.45, 0.94],
  }
} as const;

// Centralized Framer Motion duration scale (in seconds)
export const DURATIONS = {
  instant: 0.08,    // 80ms
  fast: 0.15,       // 150ms
  base: 0.25,       // 250ms
  slow: 0.4,        // 400ms
  cinematic: 0.6,   // 600ms
  ambient: 3.0,     // 3000ms
  breath: 4.0,      // 4000ms
} as const;

// Custom React hook to subscribe to prefers-reduced-motion media query
export function usePrefersReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mediaQuery.matches);

    const listener = (event: MediaQueryListEvent) => {
      setPrefersReduced(event.matches);
    };

    // Modern browser event listener
    mediaQuery.addEventListener("change", listener);
    return () => {
      mediaQuery.removeEventListener("change", listener);
    };
  }, []);

  return prefersReduced;
}
