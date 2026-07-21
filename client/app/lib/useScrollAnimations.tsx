"use client";

import { useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePrefersReducedMotion } from "./motion";

// Register GSAP plugins once
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Creates a parallax effect on a DOM element based on scroll position.
 * @param speed - Parallax speed multiplier (0 = fixed, 1 = normal scroll speed).
 *   Values < 1 make the element scroll slower (background feel).
 *   Values > 1 make it scroll faster (foreground feel).
 * @param options - Optional GSAP ScrollTrigger config overrides.
 */
export function useParallax(
  speed: number = 0.5,
  options?: {
    start?: string;
    end?: string;
    mobileSpeed?: number;
  }
) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion || !ref.current) return;

    const isMobile = window.innerWidth < 768;
    const effectiveSpeed = isMobile
      ? (options?.mobileSpeed ?? speed * 0.5 + 0.5) // Reduce parallax intensity on mobile
      : speed;

    // Calculate the y offset based on speed difference from normal (1.0)
    const yPercent = (1 - effectiveSpeed) * 100;

    const tween = gsap.to(ref.current, {
      yPercent,
      ease: "none",
      scrollTrigger: {
        trigger: ref.current,
        start: options?.start ?? "top bottom",
        end: options?.end ?? "bottom top",
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [speed, prefersReducedMotion, options?.start, options?.end, options?.mobileSpeed]);

  return ref;
}

/**
 * Creates a pinned section with a GSAP timeline that scrubs on scroll.
 * Returns a ref for the pin container and a callback to get the timeline.
 */
export function usePinnedTimeline(config?: {
  scrub?: number;
  anticipatePin?: number;
  pinnedSpacing?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const getTimeline = useCallback(() => timelineRef.current, []);

  useEffect(() => {
    if (prefersReducedMotion || !containerRef.current) return;

    const isMobile = window.innerWidth < 768;

    // On mobile, don't pin — just return
    if (isMobile) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: config?.pinnedSpacing ?? "+=300%",
        pin: true,
        scrub: config?.scrub ?? 0.8,
        anticipatePin: config?.anticipatePin ?? 1,
        invalidateOnRefresh: true,
      },
    });

    timelineRef.current = tl;

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
      timelineRef.current = null;
    };
  }, [prefersReducedMotion, config?.scrub, config?.anticipatePin, config?.pinnedSpacing]);

  return { containerRef, getTimeline };
}

/**
 * Creates a scroll-linked progress value (0-1) for a given element.
 * Calls `onUpdate` with the progress value on every scroll frame.
 */
export function useScrollProgress(
  onUpdate: (progress: number) => void,
  options?: {
    start?: string;
    end?: string;
  }
) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const callbackRef = useRef(onUpdate);
  callbackRef.current = onUpdate;

  useEffect(() => {
    if (prefersReducedMotion || !ref.current) return;

    const trigger = ScrollTrigger.create({
      trigger: ref.current,
      start: options?.start ?? "top bottom",
      end: options?.end ?? "bottom top",
      scrub: true,
      onUpdate: (self) => {
        callbackRef.current(self.progress);
      },
    });

    return () => {
      trigger.kill();
    };
  }, [prefersReducedMotion, options?.start, options?.end]);

  return ref;
}

/**
 * Creates a hero entrance timeline using GSAP.
 * Splits headline words and animates them with stagger.
 */
export function useHeroEntrance() {
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;

    const tl = gsap.timeline({ delay: 0.15 });

    // Animate headline words
    if (headlineRef.current) {
      const wordInners = headlineRef.current.querySelectorAll(".word-inner");
      if (wordInners.length > 0) {
        tl.from(wordInners, {
          y: "110%",
          opacity: 0,
          filter: "blur(6px)",
          duration: 0.8,
          ease: "expo.out",
          stagger: 0.07,
        });
      }
    }

    // Animate body copy
    if (bodyRef.current) {
      tl.from(
        bodyRef.current,
        {
          y: 30,
          opacity: 0,
          filter: "blur(6px)",
          duration: 0.7,
          ease: "expo.out",
        },
        "-=0.35"
      );
    }

    // Animate CTA buttons
    if (ctaRef.current) {
      const buttons = ctaRef.current.children;
      tl.from(
        buttons,
        {
          y: 16,
          opacity: 0,
          scale: 0.95,
          duration: 0.5,
          ease: "expo.out",
          stagger: 0.08,
        },
        "-=0.3"
      );
    }

    return () => {
      tl.kill();
    };
  }, [prefersReducedMotion]);

  return { headlineRef, bodyRef, ctaRef };
}

/**
 * Utility: splits text into word spans for animation.
 */
export function splitWords(text: string): React.ReactNode[] {
  return text.split(" ").map((word, i) => (
    <span key={i} className="word-wrapper">
      <span className="word-inner">{word}</span>
    </span>
  ));
}

/**
 * Refresh all ScrollTrigger instances — call after layout changes.
 */
export function refreshScrollTriggers() {
  if (typeof window !== "undefined") {
    ScrollTrigger.refresh();
  }
}
