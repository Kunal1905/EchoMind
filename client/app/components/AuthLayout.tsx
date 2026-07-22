"use client";

import { motion } from "motion/react";
import { useEffect, useRef, ReactNode } from "react";
import { MessageCircle, Brain, ShieldCheck, TrendingUp } from "lucide-react";

// ─── Mini constellation canvas for the branding panel ───────────────────────
function BrandingParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;
    let raf = 0;
    let frame = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const colors = ["#8052ff", "#ffb829", "#15846e", "#b96cff", "#2f7dff", "#ff4fb8"];
    const count = 60;
    const particles = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1.2 + Math.random() * 2.4,
      speed: 0.1 + Math.random() * 0.35,
      phase: Math.random() * Math.PI * 2,
      color: colors[i % colors.length],
      alpha: 0.12 + Math.random() * 0.28,
      rotation: Math.random() * Math.PI * 2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const t = frame / 60;
      for (const p of particles) {
        const x = (p.x / 100) * width + (reduced ? 0 : Math.sin(t * p.speed + p.phase) * 8);
        const y = (p.y / 100) * height + (reduced ? 0 : Math.cos(t * p.speed + p.phase) * 6);
        const rot = p.rotation + (reduced ? 0 : t * 0.15 * p.speed);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.globalAlpha = p.alpha;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size * 0.9, p.size * 0.65);
        ctx.lineTo(-p.size * 0.9, p.size * 0.65);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }
      frame++;
      if (!reduced) raf = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 w-full h-full"
      aria-hidden="true"
    />
  );
}

// ─── Feature card ────────────────────────────────────────────────────────────
function FeatureCard({
  icon: Icon,
  title,
  desc,
  delay,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay }}
      className="flex items-start gap-4 rounded-2xl p-4"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
        style={{ background: "rgba(128,82,255,0.18)" }}
      >
        <Icon size={18} style={{ color: "#a78bfa" }} />
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "#9a9a9a" }}>
          {desc}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Clerk appearance config ─────────────────────────────────────────────────
export const clerkAppearance = {
  layout: {
    logoPlacement: "none" as const,
    showOptionalFields: true,
    socialButtonsPlacement: "top" as const,
    socialButtonsVariant: "blockButton" as const,
  },
  variables: {
    colorPrimary: "#8052ff",
    colorBackground: "transparent",
    colorInputBackground: "rgba(255,255,255,0.05)",
    colorInputText: "#ffffff",
    colorText: "#ffffff",
    colorTextSecondary: "#9a9a9a",
    colorNeutral: "#9a9a9a",
    colorDanger: "#f43f5e",
    colorSuccess: "#10b981",
    fontFamily: "var(--font-inter), system-ui, sans-serif",
    fontSize: "14px",
    borderRadius: "12px",
    spacingUnit: "16px",
  },
  elements: {
    // Root card — fully transparent, we supply our own glass card
    card: "bg-transparent shadow-none border-0 p-0",
    rootBox: "w-full",

    // Header
    headerTitle: "text-white text-xl font-semibold tracking-tight hidden",
    headerSubtitle: "hidden",

    // Social buttons
    socialButtonsBlockButton:
      "w-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all duration-200 rounded-xl font-medium",
    socialButtonsBlockButtonText: "text-white font-medium text-sm",
    socialButtonsBlockButtonArrow: "text-white/50",

    // Divider
    dividerRow: "text-[#9a9a9a]",
    dividerText: "text-[#9a9a9a] text-xs",
    dividerLine: "bg-white/10",

    // Form fields
    formFieldLabel: "text-[#bdbdbd] text-xs font-medium uppercase tracking-wide mb-1",
    formFieldInput:
      "bg-white/5 border border-white/10 text-white placeholder:text-white/30 rounded-xl px-4 py-3 focus:border-[#8052ff] focus:ring-2 focus:ring-[#8052ff]/20 transition-all duration-200 text-sm",
    formFieldInputShowPasswordButton: "text-[#9a9a9a] hover:text-white",

    // Primary button
    formButtonPrimary:
      "w-full bg-gradient-to-r from-[#8052ff] to-[#6340cc] hover:from-[#9066ff] hover:to-[#7450dd] text-white font-semibold rounded-xl py-3 transition-all duration-200 shadow-lg shadow-[#8052ff]/25 hover:shadow-[#8052ff]/40 hover:-translate-y-0.5 active:translate-y-0",

    // Footer links
    footerActionLink: "text-[#8052ff] hover:text-[#a78bfa] transition-colors duration-150 font-medium",
    footerActionText: "text-[#9a9a9a] text-sm",

    // Error & alerts
    formFieldErrorText: "text-[#f43f5e] text-xs mt-1",
    alert: "rounded-xl border border-[#f43f5e]/20 bg-[#f43f5e]/10 text-[#f43f5e] text-sm",
    alertText: "text-[#f43f5e]",

    // Internal card sub-sections
    form: "gap-4",
    formHeader: "hidden",

    // OTP / code inputs
    otpCodeFieldInput:
      "bg-white/5 border border-white/10 text-white rounded-xl text-center font-mono text-lg focus:border-[#8052ff] focus:ring-2 focus:ring-[#8052ff]/20",
  },
};

// ─── Main AuthLayout ─────────────────────────────────────────────────────────
interface AuthLayoutProps {
  children: ReactNode;
  mode: "sign-in" | "sign-up";
}

const features = [
  {
    icon: Brain,
    title: "AI Mood Analysis",
    desc: "Understand your emotional patterns with intelligent session summaries.",
  },
  {
    icon: ShieldCheck,
    title: "Private & Secure",
    desc: "End-to-end encrypted conversations. Only you can access your reflections.",
  },
  {
    icon: TrendingUp,
    title: "Daily Progress Tracking",
    desc: "Visualize your mental wellness journey with rich mood graphs and insights.",
  },
];

export default function AuthLayout({ children, mode }: AuthLayoutProps) {
  return (
    <div
      className="relative flex min-h-screen w-full overflow-hidden"
      style={{ background: "#000000" }}
    >
      {/* ─── Subtle full-page grid overlay ──────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage: `
            linear-gradient(rgba(128,82,255,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(128,82,255,0.035) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          LEFT — BRANDING PANEL (hidden on mobile)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative hidden lg:flex lg:w-[58%] flex-col justify-between overflow-hidden">
        {/* Gradient background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 70% at 30% 40%, rgba(128,82,255,0.22) 0%, rgba(21,132,110,0.12) 50%, transparent 100%)",
          }}
          aria-hidden="true"
        />

        {/* Animated blobs */}
        <motion.div
          className="pointer-events-none absolute"
          style={{
            width: 520,
            height: 520,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(128,82,255,0.18) 0%, transparent 70%)",
            top: "-10%",
            left: "-8%",
            filter: "blur(40px)",
          }}
          animate={{ scale: [1, 1.08, 1], x: [0, 20, 0], y: [0, -15, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden="true"
        />
        <motion.div
          className="pointer-events-none absolute"
          style={{
            width: 380,
            height: 380,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(21,132,110,0.16) 0%, transparent 70%)",
            bottom: "5%",
            right: "5%",
            filter: "blur(48px)",
          }}
          animate={{ scale: [1, 1.12, 1], x: [0, -18, 0], y: [0, 20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          aria-hidden="true"
        />
        <motion.div
          className="pointer-events-none absolute"
          style={{
            width: 280,
            height: 280,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255,184,41,0.10) 0%, transparent 70%)",
            top: "55%",
            left: "15%",
            filter: "blur(36px)",
          }}
          animate={{ scale: [1, 1.15, 1], y: [0, -25, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 6 }}
          aria-hidden="true"
        />

        {/* Particle canvas */}
        <BrandingParticles />

        {/* Panel content */}
        <div className="relative z-10 flex flex-col justify-between h-full px-14 py-14">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-3"
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{
                background: "linear-gradient(135deg, #8052ff 0%, #15846e 100%)",
              }}
            >
              <MessageCircle size={20} className="text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">
              EchoMind
            </span>
          </motion.div>

          {/* Headline block */}
          <div className="flex-1 flex flex-col justify-center py-12">
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            >
              <p
                className="mb-4 text-xs font-semibold uppercase tracking-widest"
                style={{ color: "#ffb829" }}
              >
                Your AI Mental Wellness Companion
              </p>
              <h1
                className="text-5xl xl:text-6xl font-normal leading-[1.06] tracking-[-0.04em] text-white"
                style={{ maxWidth: 520 }}
              >
                Give your mind<br />a place to{" "}
                <span
                  style={{
                    background: "linear-gradient(90deg, #a78bfa 0%, #34d399 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  speak.
                </span>
              </h1>
              <p
                className="mt-6 text-base font-light leading-relaxed"
                style={{ color: "#9a9a9a", maxWidth: 420 }}
              >
                Journal your thoughts, analyze your emotions, and track your mental
                wellness with AI-powered insights — privately and securely.
              </p>
            </motion.div>

            {/* Feature cards */}
            <div className="mt-10 flex flex-col gap-3" style={{ maxWidth: 480 }}>
              {features.map((f, i) => (
                <FeatureCard
                  key={f.title}
                  icon={f.icon}
                  title={f.title}
                  desc={f.desc}
                  delay={0.25 + i * 0.1}
                />
              ))}
            </div>
          </div>

          {/* Trust footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="text-xs"
            style={{ color: "#71717a" }}
          >
            Trusted by students, professionals, and creators worldwide.
          </motion.p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          RIGHT — AUTH PANEL
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-5 py-12 lg:px-12">
        {/* Subtle radial glow behind the card */}
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          aria-hidden="true"
          style={{
            width: 500,
            height: 500,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(128,82,255,0.12) 0%, transparent 70%)",
            filter: "blur(24px)",
          }}
        />

        {/* Mobile logo (only shown on small screens) */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 flex items-center gap-3 lg:hidden"
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{
              background: "linear-gradient(135deg, #8052ff 0%, #15846e 100%)",
            }}
          >
            <MessageCircle size={17} className="text-white" />
          </div>
          <span className="text-base font-semibold tracking-tight text-white">
            EchoMind
          </span>
        </motion.div>

        {/* Glassmorphism card */}
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="relative w-full"
          style={{ maxWidth: 440 }}
        >
          {/* Card glow ring */}
          <div
            className="absolute -inset-px rounded-2xl"
            aria-hidden="true"
            style={{
              background:
                "linear-gradient(135deg, rgba(128,82,255,0.4) 0%, rgba(21,132,110,0.2) 50%, rgba(255,184,41,0.15) 100%)",
              borderRadius: "inherit",
              mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
              padding: 1,
            }}
          />

          <div
            className="relative rounded-2xl p-8"
            style={{
              background: "rgba(10, 10, 18, 0.82)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(128,82,255,0.18)",
              boxShadow:
                "0 0 0 1px rgba(255,255,255,0.04), 0 32px 64px rgba(0,0,0,0.6), 0 0 40px rgba(128,82,255,0.08)",
            }}
          >
            {/* Card header */}
            <div className="mb-7">
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                {mode === "sign-in" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="mt-1.5 text-sm" style={{ color: "#9a9a9a" }}>
                {mode === "sign-in"
                  ? "Continue your journey with EchoMind."
                  : "Start your mental wellness journey today."}
              </p>
            </div>

            {/* Clerk component injected here */}
            {children}
          </div>
        </motion.div>

        {/* Bottom back link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-6 text-xs"
          style={{ color: "#71717a" }}
        >
          {mode === "sign-in" ? (
            <>
              Don&apos;t have an account?{" "}
              <a
                href="/sign-up"
                className="font-medium transition-colors"
                style={{ color: "#8052ff" }}
                onMouseEnter={(e) =>
                  ((e.target as HTMLElement).style.color = "#a78bfa")
                }
                onMouseLeave={(e) =>
                  ((e.target as HTMLElement).style.color = "#8052ff")
                }
              >
                Sign up free
              </a>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <a
                href="/sign-in"
                className="font-medium transition-colors"
                style={{ color: "#8052ff" }}
                onMouseEnter={(e) =>
                  ((e.target as HTMLElement).style.color = "#a78bfa")
                }
                onMouseLeave={(e) =>
                  ((e.target as HTMLElement).style.color = "#8052ff")
                }
              >
                Sign in
              </a>
            </>
          )}
        </motion.p>
      </div>
    </div>
  );
}
