"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePrefersReducedMotion } from "../lib/motion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const COLORS = ["#8052ff", "#ffb829", "#15846e", "#b96cff", "#2f7dff", "#ff4fb8"];

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  speed: number;
  opacity: number;
  rotation: number;
}

export default function AmbientParallax() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const particleCount = isMobile ? 20 : 40;
    
    const newParticles: Particle[] = Array.from({ length: particleCount }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 12 + 8,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      speed: Math.random() * 0.4 + 0.2, // 0.2 to 0.6
      opacity: Math.random() * 0.12 + 0.06, // 0.06 to 0.18
      rotation: Math.random() * 360,
    }));
    
    setParticles(newParticles);
  }, []);

  useEffect(() => {
    if (particles.length === 0 || prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.ambient-particle').forEach((particle) => {
        const speed = parseFloat(particle.dataset.speed || "0.2");
        
        gsap.to(particle, {
          y: () => {
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            return -maxScroll * speed;
          },
          ease: "none",
          scrollTrigger: {
            trigger: document.body,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
            invalidateOnRefresh: true,
          }
        });
      });
    }, containerRef);

    return () => {
      ctx.revert();
    };
  }, [particles, prefersReducedMotion]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      {particles.map((p) => (
        <div
          key={p.id}
          className="ambient-particle absolute scroll-parallax"
          data-speed={p.speed}
          style={{
            left: `${p.x}vw`,
            top: `${p.y}vh`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
          }}
        >
          <div style={{ transform: `rotate(${p.rotation}deg)` }} className="w-full h-full">
            <div className={`w-full h-full ${prefersReducedMotion ? '' : 'animate-float-slow'}`}>
              <svg viewBox="0 0 100 100" className="w-full h-full" style={{ fill: "none", stroke: p.color, strokeWidth: 4, strokeLinecap: "round", strokeLinejoin: "round" }}>
                <polygon points="50,10 90,90 10,90" />
              </svg>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
