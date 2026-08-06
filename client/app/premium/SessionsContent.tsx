"use client";

import { Crown, Sparkles, Zap } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import ConstellationField from "../components/ConstellationField";
import PricingCard from "./PricingCard";

type SessionsContentProps = {
  onNavigate?: (page: string) => void;
  onUpgrade?: (planId: "starter") => void | Promise<void>;
  isPremium?: boolean;
  currentPlan?: "free" | "starter" | "growth" | "pro";
};

const plans = [
  {
    id: "starter" as const,
    name: "Starter",
    price: "₹399",
    minutes: 20,
    accent: "#0D9488", // Modern Teal
    accentRgb: "13, 148, 136",
    badge: "LIVE",
    icon: <Sparkles />,
    featured: true,
    available: true,
    features: [
      "20 voice conversation minutes each month",
      "AI-generated session summaries",
      "Mood timeline and history tracker",
      "Secure cloud storage for logs"
    ],
  },
  {
    id: "growth" as const,
    name: "Growth",
    price: "₹799",
    minutes: 40,
    accent: "#8B5CF6", // Premium Purple
    accentRgb: "139, 92, 246",
    badge: "COMING SOON",
    icon: <Zap />,
    featured: false,
    available: false,
    features: [
      "40 voice conversation minutes each month",
      "Everything in Starter",
      "Advanced mood trend reports",
      "Priority AI summary speed"
    ],
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: "₹1,499",
    minutes: 75,
    accent: "#F59E0B", // Luxury Amber/Gold
    accentRgb: "245, 158, 11",
    badge: "COMING SOON",
    icon: <Crown />,
    featured: false,
    available: false,
    features: [
      "75 voice conversation minutes each month",
      "Everything in Growth",
      "Deep psychological insights",
      "Exclusive access to future features"
    ],
  },
];

export function SessionsContent({
  onNavigate = () => {},
  onUpgrade = async () => {},
  isPremium = false,
  currentPlan = "free",
}: SessionsContentProps) {
  const posthog = usePostHog();

  return (
    <main className="void-page pt-24 pb-24 text-white min-h-screen">
      <ConstellationField density="ambient" className="fixed opacity-45" />
      
      <section className="void-section max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-16 grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-end">
          <div>
            <div className="void-kicker mb-5 inline-flex items-center gap-2">
              <Crown className="text-amber-400" size={16} />
              {isPremium ? `Plan active (${currentPlan.toUpperCase()})` : "Upgrade your EchoMind sessions"}
            </div>
            <h1 className="void-display max-w-4xl text-4xl sm:text-5xl font-extrabold tracking-tight">
              Choose the time your reflection needs.
            </h1>
          </div>
          <p className="void-copy text-neutral-400 text-lg leading-relaxed">
            Choose a monthly voice-time allowance and keep your session history available as your reflection practice grows.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-stretch">
          {plans.map((plan, index) => {
            const isCurrentPlan = currentPlan.toLowerCase() === plan.name.toLowerCase();
            return (
              <div 
                key={plan.name}
                className={`w-full h-full flex flex-col ${
                  index === 2 
                    ? "md:col-span-2 md:max-w-md md:mx-auto lg:col-span-1 lg:max-w-none" 
                    : ""
                }`}
              >
                <PricingCard
                  title={plan.name}
                  price={plan.price}
                  minutes={plan.minutes}
                  icon={plan.icon}
                  accent={plan.accent}
                  accentRgb={plan.accentRgb}
                  badge={plan.badge}
                  featured={plan.featured}
                  available={plan.available}
                  features={plan.features}
                  isCurrentPlan={isCurrentPlan}
                  index={index}
                  onUpgrade={() => {
                    if (plan.id !== "starter") return;
                    posthog.capture("upgrade_clicked", { planId: plan.id, price: plan.price });
                    onUpgrade(plan.id);
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Footer Navigation */}
        <div className="mt-16 text-center">
          <button
            onClick={() => onNavigate("home")}
            className="void-ghost text-neutral-400 hover:text-white transition-colors duration-200"
          >
            Back to home
          </button>
        </div>
      </section>
    </main>
  );
}

export default SessionsContent;
