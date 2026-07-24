"use client";

import { motion } from "motion/react";
import { useEffect, useRef, ReactNode } from "react";
import { MessageCircle, Brain, ShieldCheck, TrendingUp } from "lucide-react";


// ─── BrandingParticles ────────────────────────────────────────────────────────
function BrandingParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let raf = 0;
    let frame = 0;

    const colors = ["#8052ff", "#ffb829", "#15846e", "#b96cff", "#2f7dff", "#ff4fb8"];
    const count = 55;
    const particles = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1.2 + Math.random() * 2.4,
      speed: 0.08 + Math.random() * 0.3,
      phase: Math.random() * Math.PI * 2,
      color: colors[i % colors.length],
      alpha: 0.10 + Math.random() * 0.22,
      rotation: Math.random() * Math.PI * 2,
    }));

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const t = frame / 60;
      for (const p of particles) {
        const x = (p.x / 100) * width + (reduced ? 0 : Math.sin(t * p.speed + p.phase) * 8);
        const y = (p.y / 100) * height + (reduced ? 0 : Math.cos(t * p.speed + p.phase) * 6);
        const rot = p.rotation + (reduced ? 0 : t * 0.12 * p.speed);
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

// ─── Feature card ─────────────────────────────────────────────────────────────
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
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay }}
      className="flex items-start gap-3 rounded-xl p-4"
      style={{
        background: "rgba(255,255,255,0.035)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div
        className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
        style={{ background: "rgba(128,82,255,0.18)" }}
      >
        <Icon size={15} style={{ color: "#a78bfa" }} />
      </div>
      <div>
        <p className="text-sm font-semibold leading-snug text-white">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "#71717a" }}>
          {desc}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Clerk appearance config ──────────────────────────────────────────────────
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
    // Smaller spacingUnit prevents the oversized button padding multiplication
    spacingUnit: "1rem",
  },
  elements: {
    card: "shadow-none border-0 bg-transparent p-0 overflow-visible",
    rootBox: "w-full overflow-visible",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    formHeader: "hidden",

    socialButtonsBlockButton: "relative flex flex-row items-center justify-center gap-3 h-12 w-full px-4 border border-white/10 hover:bg-white/5 transition-all duration-200",
    socialButtonsBlockButtonText: "text-white text-sm font-medium",
    socialButtonsBlockButtonLogo: "h-5 w-5 flex-shrink-0 flex items-center justify-center mr-0",
    socialButtonsBlockButtonArrow: "hidden",
    socialButtonsBlockButtonBadge: "absolute -top-2.5 right-4 bg-[#8052ff] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-[#090910] shadow-sm",

    dividerRow: "my-1",
    dividerText: "text-xs",
    dividerLine: "bg-white/10",

    formFieldLabel: "text-[11px] font-semibold uppercase tracking-widest text-[#9a9a9a] mb-1.5",
    formFieldInput: "h-12 rounded-xl text-sm",
    formFieldInputShowPasswordButton: "text-[#9a9a9a] hover:text-white",
    formFieldErrorText: "text-[#f43f5e] text-[11px] mt-1",

    formButtonPrimary: "h-12 rounded-xl text-sm font-semibold w-full",

    footerActionLink: "text-[#8052ff] hover:text-[#a78bfa] font-medium transition-colors",
    footerActionText: "text-[#9a9a9a] text-[13px]",
    footer: "bg-transparent mt-4 overflow-visible pb-2",
    footerBranding: "mt-4 flex justify-center items-center overflow-visible pb-2",

    alert: "rounded-xl border border-[#f43f5e]/20 bg-[#f43f5e]/8 text-[#f43f5e] text-sm p-3",
    alertText: "text-[#f43f5e] text-sm",

    form: "gap-3.5",
    otpCodeFieldInput: "bg-white/5 border-white/10 text-white rounded-xl",
  },
};

// ─── AuthLayout ───────────────────────────────────────────────────────────────
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
    desc: "End-to-end encrypted. Only you can access your reflections.",
  },
  {
    icon: TrendingUp,
    title: "Daily Progress Tracking",
    desc: "Visualize your wellness journey with rich mood graphs and insights.",
  },
];

export default function AuthLayout({ children, mode }: AuthLayoutProps) {
  return (
    <div
        className="relative flex min-h-screen w-full overflow-hidden"
        style={{ background: "#000000" }}
      >
        {/* Full-page grid */}
        <div
          className="pointer-events-none absolute inset-0 z-0"
          aria-hidden="true"
          style={{
            backgroundImage: `
              linear-gradient(rgba(128,82,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(128,82,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: "56px 56px",
          }}
        />

        {/* ═══════════════════════════════════════════════════════════════
            LEFT — BRANDING PANEL  (hidden on mobile, 60% on desktop)
        ═══════════════════════════════════════════════════════════════ */}
        <div className="relative hidden lg:flex lg:w-[60%] flex-col overflow-hidden">
          {/* Gradient wash */}
          <div
            className="absolute inset-0"
            aria-hidden="true"
            style={{
              background:
                "radial-gradient(ellipse 75% 65% at 25% 40%, rgba(128,82,255,0.2) 0%, rgba(21,132,110,0.1) 55%, transparent 100%)",
            }}
          />

          {/* Animated blobs */}
          {[
            { w: 480, h: 480, top: "-12%", left: "-10%", color: "rgba(128,82,255,0.16)", dur: 12, delay: 0 },
            { w: 340, h: 340, top: "auto", left: "auto", bottom: "4%", right: "4%", color: "rgba(21,132,110,0.14)", dur: 15, delay: 3 },
            { w: 260, h: 260, top: "52%", left: "12%", color: "rgba(255,184,41,0.09)", dur: 10, delay: 6 },
          ].map((b, i) => (
            <motion.div
              key={i}
              className="pointer-events-none absolute rounded-full"
              style={{
                width: b.w,
                height: b.h,
                top: b.top,
                left: b.left,
                bottom: (b as any).bottom,
                right: (b as any).right,
                background: `radial-gradient(circle, ${b.color} 0%, transparent 70%)`,
                filter: "blur(42px)",
              }}
              animate={{ scale: [1, 1.1, 1], x: [0, 16, 0], y: [0, -14, 0] }}
              transition={{ duration: b.dur, repeat: Infinity, ease: "easeInOut", delay: b.delay }}
              aria-hidden="true"
            />
          ))}

          <BrandingParticles />

          {/* Content — fixed padding, proper vertical rhythm */}
          <div className="relative z-10 flex h-full flex-col px-12 py-12">
            {/* Logo row */}
            <motion.div
              initial={{ opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-3"
            >
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
                style={{ background: "linear-gradient(135deg, #8052ff 0%, #15846e 100%)" }}
              >
                <MessageCircle size={17} className="text-white" />
              </div>
              <span className="text-[15px] font-semibold tracking-tight text-white">
                EchoMind
              </span>
            </motion.div>

            {/* Centre block */}
            <div className="flex flex-1 flex-col justify-center gap-8 py-10">
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              >
                <p
                  className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: "#ffb829" }}
                >
                  Your AI Mental Wellness Companion
                </p>
                <h1
                  className="text-[48px] xl:text-[56px] font-normal leading-[1.06] tracking-[-0.04em] text-white"
                  style={{ maxWidth: 500 }}
                >
                  Give your mind
                  <br />a place to{" "}
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
                  className="mt-5 text-[15px] font-light leading-relaxed"
                  style={{ color: "#9a9a9a", maxWidth: 400 }}
                >
                  Journal your thoughts, analyze your emotions, and track your
                  mental wellness with AI-powered insights — privately and securely.
                </p>
              </motion.div>

              {/* Feature cards */}
              <div className="flex flex-col gap-2.5" style={{ maxWidth: 460 }}>
                {features.map((f, i) => (
                  <FeatureCard
                    key={f.title}
                    icon={f.icon}
                    title={f.title}
                    desc={f.desc}
                    delay={0.22 + i * 0.1}
                  />
                ))}
              </div>
            </div>

            {/* Trust line */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.65 }}
              className="text-[11px]"
              style={{ color: "#52525b" }}
            >
              Trusted by students, professionals, and creators worldwide.
            </motion.p>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            RIGHT — AUTH PANEL  (40% desktop, full-width mobile)
        ═══════════════════════════════════════════════════════════════ */}
        <div className="relative flex flex-1 flex-col items-center justify-center px-5 py-10 lg:px-10">
          {/* Glow behind card */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            aria-hidden="true"
            style={{
              width: 420,
              height: 420,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(128,82,255,0.1) 0%, transparent 70%)",
              filter: "blur(32px)",
            }}
          />

          {/* Mobile logo */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mb-7 flex items-center gap-2.5 lg:hidden"
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ background: "linear-gradient(135deg, #8052ff 0%, #15846e 100%)" }}
            >
              <MessageCircle size={15} className="text-white" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-white">
              EchoMind
            </span>
          </motion.div>

          {/* Glass card */}
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
            className="relative w-full"
            style={{ maxWidth: 400 }}
          >
            {/* Gradient border ring */}
            <div
              aria-hidden="true"
              className="absolute -inset-px rounded-2xl"
              style={{
                background:
                  "linear-gradient(135deg, rgba(128,82,255,0.45) 0%, rgba(21,132,110,0.22) 50%, rgba(255,184,41,0.14) 100%)",
                borderRadius: "inherit",
                mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
                padding: 1,
              }}
            />

            {/* Card body */}
            <div
              className="relative rounded-2xl px-6 py-8 sm:px-8 sm:py-9"
              style={{
                background: "rgba(9, 9, 16, 0.88)",
                backdropFilter: "blur(28px)",
                WebkitBackdropFilter: "blur(28px)",
                border: "1px solid rgba(128,82,255,0.15)",
                boxShadow:
                  "0 0 0 1px rgba(255,255,255,0.03), 0 24px 56px rgba(0,0,0,0.65), 0 0 48px rgba(128,82,255,0.07)",
              }}
            >
              {/* Our custom header — sits above Clerk component */}
              <div className="mb-4">
                <h2 className="text-[22px] font-semibold leading-tight tracking-tight text-white">
                  {mode === "sign-in" ? "Welcome back" : "Create your account"}
                </h2>
                <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: "#9a9a9a" }}>
                  {mode === "sign-in"
                    ? "Continue your journey with EchoMind."
                    : "Start your mental wellness journey today."}
                </p>
              </div>

              {/* Clerk component */}
              {children}
            </div>
          </motion.div>

        </div>
      </div>
  );
}
