"use client";

import { motion } from "motion/react";
import { useEffect, useRef, ReactNode } from "react";
import { MessageCircle, Brain, ShieldCheck, TrendingUp } from "lucide-react";

// ─── CSS injected to fix Clerk internals that the appearance prop can't reach ─
const CLERK_OVERRIDES = `
  /* ── Clerk card root: strip all internal padding/shadow, we own the shell ── */
  .cl-card,
  .cl-card:focus-within { 
    padding: 0 !important; 
    box-shadow: none !important; 
    border: none !important; 
    background: transparent !important;
    border-radius: 0 !important;
  }
  .cl-rootBox { width: 100% !important; }
  .cl-main { width: 100% !important; }

  /* ── Header: we render our own, hide Clerk's ── */
  .cl-header,
  .cl-headerTitle,
  .cl-headerSubtitle { display: none !important; }

  /* ── Inputs: full width, fixed 48px height ── */
  .cl-formFieldRow { width: 100% !important; }
  .cl-formField { width: 100% !important; margin-bottom: 0 !important; }
  .cl-formFieldInput,
  .cl-formFieldInput:focus {
    display: block !important;
    width: 100% !important;
    height: 48px !important;
    min-height: 48px !important;
    max-height: 48px !important;
    border-radius: 12px !important;
    padding: 0 16px !important;
    font-size: 14px !important;
    background: rgba(255,255,255,0.05) !important;
    border: 1px solid rgba(255,255,255,0.1) !important;
    color: #ffffff !important;
    box-sizing: border-box !important;
    transition: border-color 0.2s, box-shadow 0.2s !important;
    outline: none !important;
  }
  .cl-formFieldInput:focus {
    border-color: #8052ff !important;
    box-shadow: 0 0 0 3px rgba(128, 82, 255, 0.15) !important;
  }
  .cl-formFieldInput::placeholder { color: rgba(255,255,255,0.28) !important; }

  /* ── Labels ── */
  .cl-formFieldLabel {
    display: block !important;
    font-size: 11px !important;
    font-weight: 600 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.08em !important;
    color: #9a9a9a !important;
    margin-bottom: 6px !important;
  }
  .cl-formFieldHintText { color: #9a9a9a !important; font-size: 11px !important; }
  .cl-formFieldLabelRow { margin-bottom: 0 !important; }

  /* ── Primary/Continue button: fixed height, NO giant padding ── */
  .cl-formButtonPrimary {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 100% !important;
    height: 48px !important;
    min-height: 48px !important;
    max-height: 48px !important;
    padding: 0 24px !important;
    border-radius: 12px !important;
    font-size: 14px !important;
    font-weight: 600 !important;
    letter-spacing: 0.01em !important;
    color: #ffffff !important;
    background: linear-gradient(135deg, #8052ff 0%, #5e38c8 100%) !important;
    box-shadow: 0 4px 20px rgba(128, 82, 255, 0.35) !important;
    border: none !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    margin: 0 !important;
  }
  .cl-formButtonPrimary:hover {
    background: linear-gradient(135deg, #9366ff 0%, #6d45d8 100%) !important;
    box-shadow: 0 6px 28px rgba(128, 82, 255, 0.5) !important;
    transform: translateY(-1px) !important;
  }
  .cl-formButtonPrimary:active { transform: translateY(0) !important; }
  .cl-formButtonPrimary:disabled { opacity: 0.6 !important; transform: none !important; }

  /* ── Secondary/outline buttons ── */
  .cl-formButtonReset,
  .cl-formButtonSecondary {
    height: 40px !important;
    font-size: 13px !important;
    color: #9a9a9a !important;
    background: transparent !important;
  }

  /* ── Social login button (Google) ── */
  .cl-socialButtonsBlockButton {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 10px !important;
    width: 100% !important;
    height: 48px !important;
    min-height: 48px !important;
    padding: 0 20px !important;
    border-radius: 12px !important;
    background: rgba(255,255,255,0.05) !important;
    border: 1px solid rgba(255,255,255,0.1) !important;
    color: #ffffff !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    cursor: pointer !important;
    transition: background 0.2s, border-color 0.2s !important;
    position: relative !important;
  }
  .cl-socialButtonsBlockButton:hover {
    background: rgba(255,255,255,0.09) !important;
    border-color: rgba(255,255,255,0.18) !important;
  }
  .cl-socialButtonsBlockButtonText { 
    color: #ffffff !important; 
    font-size: 14px !important;
    font-weight: 500 !important;
    text-align: center !important;
  }
  /* Social icon: fixed size, no floating */
  .cl-socialButtonsBlockButton svg,
  .cl-socialButtonsBlockButton img {
    width: 18px !important;
    height: 18px !important;
    flex-shrink: 0 !important;
    position: static !important;
  }
  .cl-socialButtonsBlockButtonArrow { display: none !important; }

  /* ── Divider ── */
  .cl-dividerRow {
    display: flex !important;
    align-items: center !important;
    gap: 12px !important;
    margin: 4px 0 !important;
  }
  .cl-dividerLine {
    flex: 1 !important;
    height: 1px !important;
    background: rgba(255,255,255,0.1) !important;
  }
  .cl-dividerText { 
    color: #71717a !important; 
    font-size: 12px !important;
    white-space: nowrap !important;
  }

  /* ── Form layout: consistent vertical gap ── */
  .cl-form {
    display: flex !important;
    flex-direction: column !important;
    gap: 14px !important;
    width: 100% !important;
  }

  /* ── Error messages ── */
  .cl-formFieldErrorText {
    color: #f43f5e !important;
    font-size: 11px !important;
    margin-top: 4px !important;
  }
  .cl-alert {
    border-radius: 10px !important;
    border: 1px solid rgba(244,63,94,0.2) !important;
    background: rgba(244,63,94,0.08) !important;
    padding: 10px 14px !important;
    font-size: 13px !important;
    color: #f43f5e !important;
  }

  /* ── Footer: "Secured by Clerk" — scale way down ── */
  .cl-footer {
    margin-top: 8px !important;
    padding: 0 !important;
  }
  .cl-footerAction {
    margin-bottom: 0 !important;
    padding: 0 !important;
  }
  /* The actual Clerk branding logo block */
  .cl-footerPages,
  .cl-footer [class*="powered"],
  .cl-footer [class*="branding"],
  .cl-footer [class*="logo"] {
    transform: scale(0.55) !important;
    transform-origin: center !important;
    opacity: 0.45 !important;
    margin: -4px auto 0 !important;
  }
  /* Dev mode badge */
  .cl-badge {
    font-size: 10px !important;
    padding: 2px 8px !important;
    opacity: 0.6 !important;
    margin-top: 6px !important;
  }

  /* ── OTP inputs ── */
  .cl-otpCodeFieldInput {
    background: rgba(255,255,255,0.05) !important;
    border: 1px solid rgba(255,255,255,0.1) !important;
    color: #ffffff !important;
    border-radius: 12px !important;
    font-size: 20px !important;
    font-weight: 600 !important;
    width: 48px !important;
    height: 56px !important;
    text-align: center !important;
  }
  .cl-otpCodeFieldInput:focus {
    border-color: #8052ff !important;
    box-shadow: 0 0 0 3px rgba(128,82,255,0.15) !important;
  }

  /* ── Footer link (sign in / sign up toggle inside Clerk) ── */
  .cl-footerActionLink {
    color: #8052ff !important;
    font-weight: 500 !important;
    transition: color 0.15s !important;
  }
  .cl-footerActionLink:hover { color: #a78bfa !important; }
  .cl-footerActionText { color: #9a9a9a !important; font-size: 13px !important; }

  /* ── Password show/hide toggle ── */
  .cl-formFieldInputShowPasswordButton { color: #9a9a9a !important; }
  .cl-formFieldInputShowPasswordButton:hover { color: #ffffff !important; }

  /* ── Remove any Clerk inner scrollable areas ── */
  .cl-scrollBox { overflow: visible !important; }
`;

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
    card: "shadow-none border-0 bg-transparent p-0",
    rootBox: "w-full",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    formHeader: "hidden",

    socialButtonsBlockButton: "h-12",
    socialButtonsBlockButtonText: "text-white text-sm font-medium",
    socialButtonsBlockButtonArrow: "hidden",

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
    <>
      {/* Inject surgical Clerk CSS overrides */}
      <style dangerouslySetInnerHTML={{ __html: CLERK_OVERRIDES }} />

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
            style={{ maxWidth: 440 }}
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
              className="relative rounded-2xl"
              style={{
                padding: "32px 32px 28px",
                background: "rgba(9, 9, 16, 0.88)",
                backdropFilter: "blur(28px)",
                WebkitBackdropFilter: "blur(28px)",
                border: "1px solid rgba(128,82,255,0.15)",
                boxShadow:
                  "0 0 0 1px rgba(255,255,255,0.03), 0 24px 56px rgba(0,0,0,0.65), 0 0 48px rgba(128,82,255,0.07)",
              }}
            >
              {/* Our custom header — sits above Clerk component */}
              <div className="mb-6">
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

          {/* Bottom toggle link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-5 text-[12px]"
            style={{ color: "#52525b" }}
          >
            {mode === "sign-in" ? (
              <>
                Don&apos;t have an account?{" "}
                <a
                  href="/sign-up"
                  style={{ color: "#8052ff" }}
                  className="font-medium transition-colors hover:text-[#a78bfa]"
                >
                  Sign up free
                </a>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <a
                  href="/sign-in"
                  style={{ color: "#8052ff" }}
                  className="font-medium transition-colors hover:text-[#a78bfa]"
                >
                  Sign in
                </a>
              </>
            )}
          </motion.p>
        </div>
      </div>
    </>
  );
}
