"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { usePrefersReducedMotion } from "../lib/motion";

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec2 uResolution;
  varying vec2 vUv;

  // Simple 2D Noise
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  void main() {
    // Normalise UV coordinates
    vec2 uv = vUv;
    
    // Slow drift coordinates based on time and mouse parallax
    vec2 uv1 = uv * 1.5 - vec2(uTime * 0.015, uTime * 0.012) + uMouse * 0.03;
    vec2 uv2 = uv * 2.2 + vec2(uTime * 0.01, uTime * 0.015) - uMouse * 0.02;
    
    // Calculate fractal noise
    float n1 = noise(uv1);
    float n2 = noise(uv2);
    float n = (n1 + n2) * 0.5;

    // Soft violet (deepening slightly for text readability)
    vec3 colorViolet = vec3(0.25, 0.1, 0.5);
    // Soft teal
    vec3 colorTeal = vec3(0.02, 0.4, 0.35);
    // Deep dark background
    vec3 colorBg = vec3(0.039, 0.039, 0.059);
    
    // Interpolate colors based on noise
    float colorMix = smoothstep(0.2, 0.8, n);
    vec3 finalColor = mix(colorViolet, colorTeal, colorMix);
    
    // Ambient vignette fading out to deep dark background
    float vignette = smoothstep(1.3, 0.2, length(uv - 0.5));
    finalColor = mix(colorBg, finalColor, vignette * 0.25); // Subtle 25% strength mesh
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export default function HeroThreeBg() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    // Return early if user prefers reduced motion or if canvas is not available
    if (prefersReducedMotion || !canvasRef.current || !containerRef.current) return;

    let width = containerRef.current.clientWidth;
    let height = containerRef.current.clientHeight;

    // Three.js setup
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Full screen quad geometry
    const geometry = new THREE.PlaneGeometry(2, 2);
    
    // Uniforms structure
    const uniforms = {
      uTime: { value: 0.0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uResolution: { value: new THREE.Vector2(width, height) },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      depthWrite: false,
      depthTest: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Mouse tracking variables
    let mouseTargetX = 0;
    let mouseTargetY = 0;
    let mouseCurrentX = 0;
    let mouseCurrentY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      // Normalise coordinates to range [-1, 1]
      mouseTargetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseTargetY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Visibility API support to pause execution loop
    let isVisible = true;
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current) return;
      width = containerRef.current.clientWidth;
      height = containerRef.current.clientHeight;
      
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      
      uniforms.uResolution.value.set(width, height);
    };

    window.addEventListener("resize", handleResize);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isVisible) return; // Skip updating & rendering if tab is hidden

      const delta = clock.getDelta();
      // Safe guard against large delta jumps when returning to tab
      uniforms.uTime.value += Math.min(delta, 0.1);

      // Lerp mouse coordinates for custom fluid lag inertia
      mouseCurrentX += (mouseTargetX - mouseCurrentX) * 0.04;
      mouseCurrentY += (mouseTargetY - mouseCurrentY) * 0.04;
      uniforms.uMouse.value.set(mouseCurrentX, mouseCurrentY);

      renderer.render(scene, camera);
    };

    animate();

    // Clean up resources on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [prefersReducedMotion]);

  // If prefers-reduced-motion is active, render absolute nothing to conserve resource
  if (prefersReducedMotion) {
    return null;
  }

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none -z-10 bg-transparent opacity-80"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
