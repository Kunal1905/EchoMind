"use client";

import { useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type ConstellationFieldProps = {
  density?: "ambient" | "hero";
  className?: string;
};

type Particle = {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  scatterX: number;
  scatterY: number;
  size: number;
  speed: number;
  phase: number;
  color: string;
  baseColor: string;
  warmColor: string;
  alpha: number;
  baseAlpha: number;
  rotation: number;
};

const colors = ["#8052ff", "#ffb829", "#15846e", "#b96cff", "#2f7dff", "#ff4fb8"];
const warmColors = ["#ffb829", "#ff4fb8", "#ff6b4f", "#f5a623", "#e96443", "#ff4fb8"];

// Hex to RGB conversion for color interpolation
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 128, g: 82, b: 255 };
}

function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  return `rgb(${r},${g},${b})`;
}

export function ConstellationField({ density = "ambient", className = "" }: ConstellationFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollProgressRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Stable callback for scroll progress updates
  const handleScrollProgress = useCallback((progress: number) => {
    scrollProgressRef.current = progress;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let frame = 0;
    let particles: Particle[] = [];
    let animationId = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const shouldAnimate = density === "hero" && !reducedMotion;
    const isMobile = window.innerWidth < 768;

    // Set up ScrollTrigger for scroll-reactive behavior (hero only)
    let scrollTriggerInstance: ScrollTrigger | null = null;
    if (density === "hero" && !reducedMotion) {
      scrollTriggerInstance = ScrollTrigger.create({
        trigger: container,
        start: "top top",
        end: "bottom top",
        scrub: true,
        onUpdate: (self) => {
          handleScrollProgress(self.progress);
        },
      });
    }

    const setSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = density === "hero" ? 460 : 90;
      particles = Array.from({ length: count }, (_, index) => {
        const inCluster = density === "hero" && index < count * 0.86;
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.sqrt(Math.random());
        const lobe = Math.random() > 0.48 ? -1 : 1;
        const clusterWidth = width * 0.34;
        const clusterHeight = height * 0.32;
        const stem = inCluster && Math.random() > 0.9;
        const centerX = width * 0.5 + lobe * clusterWidth * 0.26;
        const centerY = height * 0.46 + Math.sin(angle * 2) * clusterHeight * 0.12;
        const baseX = inCluster
          ? stem
            ? width * 0.5 + (Math.random() - 0.5) * clusterWidth * 0.18
            : centerX + Math.cos(angle) * radius * clusterWidth
          : Math.random() * width;
        const baseY = inCluster
          ? stem
            ? height * (0.62 + Math.random() * 0.24)
            : centerY + Math.sin(angle) * radius * clusterHeight
          : Math.random() * height;

        // Pre-compute scatter positions (where particles fly to when scrolled)
        const scatterAngle = Math.random() * Math.PI * 2;
        const scatterDistance = (isMobile ? 0.3 : 0.6) * Math.max(width, height) * (0.3 + Math.random() * 0.7);
        const scatterX = baseX + Math.cos(scatterAngle) * scatterDistance;
        const scatterY = baseY + Math.sin(scatterAngle) * scatterDistance;

        const baseColor = colors[index % colors.length];
        const warmColor = warmColors[index % warmColors.length];

        return {
          x: baseX,
          y: baseY,
          baseX,
          baseY,
          scatterX,
          scatterY,
          size: inCluster ? 1.8 + Math.random() * 2.8 : 1.2 + Math.random() * 2,
          speed: 0.12 + Math.random() * 0.45,
          phase: Math.random() * Math.PI * 2,
          color: baseColor,
          baseColor,
          warmColor,
          alpha: inCluster ? 0.38 + Math.random() * 0.46 : 0.05 + Math.random() * 0.14,
          baseAlpha: inCluster ? 0.38 + Math.random() * 0.46 : 0.05 + Math.random() * 0.14,
          rotation: Math.random() * Math.PI * 2,
        };
      });
    };

    const drawTriangle = (particle: Particle, time: number) => {
      const scrollProgress = scrollProgressRef.current;

      // Apply eased scatter progress (cubic ease for smooth behavior)
      const scatterT = isMobile
        ? Math.min(scrollProgress * 2.5, 1) // Mobile: faster opacity fade, less scatter
        : Math.pow(Math.min(scrollProgress * 1.8, 1), 2); // Desktop: smooth quadratic scatter

      // Interpolate between base position and scatter position
      const targetX = particle.baseX + (particle.scatterX - particle.baseX) * scatterT;
      const targetY = particle.baseY + (particle.scatterY - particle.baseY) * scatterT;

      // Add ambient drift animation
      const drift = reducedMotion ? 0 : Math.sin(time * particle.speed + particle.phase) * 5;
      const x = targetX + drift;
      const y = targetY + Math.cos(time * particle.speed + particle.phase) * 4;

      // Color temperature shift: cool → warm as user scrolls
      const colorT = Math.min(scrollProgress * 2, 1);
      const currentColor = lerpColor(particle.baseColor, particle.warmColor, colorT * 0.7);

      // Opacity falloff: particles fade as they scatter
      const alphaFalloff = isMobile
        ? 1 - scatterT * 0.85 // Mobile: aggressive fade
        : 1 - scatterT * 0.6; // Desktop: gentler fade
      const currentAlpha = particle.baseAlpha * Math.max(alphaFalloff, 0.04);

      const rotation = particle.rotation + time * 0.18 * particle.speed;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.globalAlpha = currentAlpha;
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -particle.size);
      ctx.lineTo(particle.size * 0.9, particle.size * 0.65);
      ctx.lineTo(-particle.size * 0.9, particle.size * 0.65);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    };

    let lastRender = 0;
    const render = (timestamp = 0) => {
      if (shouldAnimate && timestamp - lastRender < 33) {
        animationId = requestAnimationFrame(render);
        return;
      }
      lastRender = timestamp;
      frame += 1;
      const time = frame / 60;
      ctx.clearRect(0, 0, width, height);

      for (const particle of particles) {
        drawTriangle(particle, time);
      }

      if (shouldAnimate) {
        animationId = requestAnimationFrame(render);
      }
    };

    setSize();
    render();

    window.addEventListener("resize", setSize);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", setSize);
      scrollTriggerInstance?.kill();
    };
  }, [density, handleScrollProgress]);

  return (
    <div ref={containerRef} className={`constellation-canvas ${className}`} aria-hidden="true">
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 w-full h-full"
        aria-hidden="true"
      />
    </div>
  );
}

export default ConstellationField;
