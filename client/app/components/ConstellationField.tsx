"use client";

import { useEffect, useRef } from "react";

type ConstellationFieldProps = {
  density?: "ambient" | "hero";
  className?: string;
};

type Particle = {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  speed: number;
  phase: number;
  color: string;
  alpha: number;
  rotation: number;
};

const colors = ["#8052ff", "#ffb829", "#15846e", "#b96cff", "#2f7dff", "#ff4fb8"];

export function ConstellationField({ density = "ambient", className = "" }: ConstellationFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let frame = 0;
    let particles: Particle[] = [];
    let animationId = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const shouldAnimate = density === "hero" && !reducedMotion;

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

        return {
          x: baseX,
          y: baseY,
          baseX,
          baseY,
          size: inCluster ? 1.8 + Math.random() * 2.8 : 1.2 + Math.random() * 2,
          speed: 0.12 + Math.random() * 0.45,
          phase: Math.random() * Math.PI * 2,
          color: colors[index % colors.length],
          alpha: inCluster ? 0.38 + Math.random() * 0.46 : 0.05 + Math.random() * 0.14,
          rotation: Math.random() * Math.PI * 2,
        };
      });
    };

    const drawTriangle = (particle: Particle, time: number) => {
      const drift = reducedMotion ? 0 : Math.sin(time * particle.speed + particle.phase) * 5;
      const scrollDrift = 0;
      const x = particle.baseX + drift;
      const y = particle.baseY + Math.cos(time * particle.speed + particle.phase) * 4 - scrollDrift;
      const rotation = particle.rotation + time * 0.18 * particle.speed;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.globalAlpha = particle.alpha;
      ctx.strokeStyle = particle.color;
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
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      className={`constellation-canvas ${className}`}
      aria-hidden="true"
    />
  );
}

export default ConstellationField;
