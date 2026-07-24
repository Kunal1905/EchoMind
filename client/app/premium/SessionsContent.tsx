"use client";

import { Crown, Sparkles, Zap } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import ConstellationField from "../components/ConstellationField";
import PricingCard from "./PricingCard";

type SessionsContentProps = {
  onNavigate?: (page: string) => void;
  onUpgrade?: (calls?: number, planName?: string, price?: string) => void | Promise<void>;
  isPremium?: boolean;
  currentPlan?: "free" | "basic" | "pro" | "premium";
};

const plans = [
  {
    name: "Basic",
    price: "₹249",
    minutes: 30,
    accent: "#0D9488", // Modern Teal
    accentRgb: "13, 148, 136",
    badge: "✨ START HERE",
    icon: <Sparkles />,
    featured: false,
    features: [
      "AI-generated session summaries",
      "Mood timeline & history tracker",
      "Secure cloud storage for logs",
      "Standard processing queue speeds"
    ],
  },
  {
    name: "Pro",
    price: "₹499",
    minutes: 60,
    accent: "#8B5CF6", // Premium Purple
    accentRgb: "139, 92, 246",
    badge: "🔥 MOST POPULAR",
    icon: <Zap />,
    featured: true,
    features: [
      "Everything in Basic plan",
      "Double voice reflection time",
      "Advanced mood trend reports",
      "Priority AI summary speed"
    ],
  },
  {
    name: "Premium",
    price: "₹999",
    minutes: 120,
    accent: "#F59E0B", // Luxury Amber/Gold
    accentRgb: "245, 158, 11",
    badge: "👑 BEST VALUE",
    icon: <Crown />,
    featured: false,
    features: [
      "Everything in Pro plan",
      "Maximum voice reflection time",
      "Deep psychological insights (AI)",
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
              {isPremium ? `Premium active (${currentPlan.toUpperCase()})` : "Upgrade your EchoMind sessions"}
            </div>
            <h1 className="void-display max-w-4xl text-4xl sm:text-5xl font-extrabold tracking-tight">
              Choose the time your reflection needs.
            </h1>
          </div>
          <p className="void-copy text-neutral-400 text-lg leading-relaxed">
            Add more guided voice time and keep your session history available as your reflection practice grows.
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
                  features={plan.features}
                  isCurrentPlan={isCurrentPlan}
                  index={index}
                  onUpgrade={() => {
                    posthog.capture("upgrade_clicked", { planId: plan.name, price: plan.price });
                    onUpgrade(Math.ceil(plan.minutes / 10), plan.name, plan.price);
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

