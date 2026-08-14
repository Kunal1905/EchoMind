"use client";

import { Check, CircleMinus, Crown, MessageCircle, Sparkles, Zap } from "lucide-react";
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
    id: "free" as const,
    name: "Free",
    price: "₹0",
    billingLabel: "no card required",
    minutes: 10,
    accent: "#E5E7EB",
    accentRgb: "229, 231, 235",
    badge: "ALWAYS AVAILABLE",
    icon: <MessageCircle />,
    featured: false,
    available: true,
    actionLabel: "Start a conversation",
    features: [
      "10 voice conversation minutes each month",
      "AI-generated session summaries",
      "Mood timeline and history",
      "Optional personalized memory",
    ],
  },
  {
    id: "starter" as const,
    name: "Starter",
    price: "₹399",
    billingLabel: "one-time payment",
    minutes: 20,
    accent: "#0D9488", // Modern Teal
    accentRgb: "13, 148, 136",
    badge: "LIVE",
    icon: <Sparkles />,
    featured: true,
    available: true,
    actionLabel: "Choose Starter",
    features: [
      "20 voice conversation minutes each month",
      "AI-generated session summaries",
      "Mood timeline and history tracker",
      "Optional personalized memory",
    ],
  },
  {
    id: "growth" as const,
    name: "Growth",
    price: "₹799",
    billingLabel: "planned price per month",
    minutes: 40,
    accent: "#8B5CF6", // Premium Purple
    accentRgb: "139, 92, 246",
    badge: "COMING SOON",
    icon: <Zap />,
    featured: false,
    available: false,
    actionLabel: "Coming soon",
    features: [
      "40 voice conversation minutes each month",
      "Everything in Starter",
      "AI-generated session summaries",
      "Mood timeline and optional memory",
    ],
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: "₹1,499",
    billingLabel: "planned price per month",
    minutes: 75,
    accent: "#F59E0B", // Luxury Amber/Gold
    accentRgb: "245, 158, 11",
    badge: "COMING SOON",
    icon: <Crown />,
    featured: false,
    available: false,
    actionLabel: "Coming soon",
    features: [
      "75 voice conversation minutes each month",
      "Everything in Growth",
      "AI-generated session summaries",
      "Mood timeline and optional memory",
    ],
  },
];

const comparisonRows = [
  { label: "Voice minutes per calendar month", values: ["10", "20", "40", "75"] },
  { label: "Session summaries", values: [true, true, true, true] },
  { label: "Mood history", values: [true, true, true, true] },
  { label: "Optional personalized memory", values: [true, true, true, true] },
  { label: "Available now", values: [true, true, false, false] },
];

const billingFaqs = [
  {
    question: "Is the Free plan a trial?",
    answer:
      "No. Free is an ongoing tier with 10 voice minutes each calendar month. It does not require a payment card and does not automatically convert into a paid plan.",
  },
  {
    question: "What happens when I use all my minutes?",
    answer:
      "New voice conversations pause until your allowance resets in the next calendar month or you choose an available paid plan. Your account and saved history remain available.",
  },
  {
    question: "Does Starter renew automatically?",
    answer:
      "No. The current Starter checkout is a one-time ₹399 Razorpay payment, not an automatic recurring debit. Starter remains active on your account and its 20-minute allowance resets each calendar month.",
  },
  {
    question: "When do monthly minutes reset?",
    answer:
      "The allowance refreshes when you first use EchoMind in a new calendar month. Unused minutes do not roll over.",
  },
  {
    question: "Can I cancel or request a refund?",
    answer:
      "There is no recurring Starter debit to cancel. Payments are generally non-refundable after the allowance is activated, except where required by law or for a billing error. Contact support within 7 days if you believe you were charged incorrectly.",
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
        <div className="mb-10 grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-end">
          <div>
            <div className="void-kicker mb-5 inline-flex items-center gap-2">
              <Crown className="text-amber-400" size={16} />
              {isPremium ? `Plan active (${currentPlan.toUpperCase()})` : "Upgrade your EchoMind sessions"}
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold text-white sm:text-5xl">
              Plans and pricing.
            </h1>
          </div>
          <p className="void-copy text-neutral-400 text-lg leading-relaxed">
            Compare monthly voice allowances. Free never auto-charges, and Starter is currently a one-time purchase through Razorpay.
          </p>
        </div>

        <div className="mb-10 flex flex-col gap-3 border-y border-white/10 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex w-fit border border-white/15 p-1" role="group" aria-label="Billing period">
            <button
              type="button"
              aria-pressed="true"
              className="bg-white px-4 py-2 text-sm font-semibold text-black"
            >
              Monthly allowances
            </button>
            <button
              type="button"
              disabled
              className="cursor-not-allowed px-4 py-2 text-sm font-semibold text-white/35"
              title="Annual billing is not available"
            >
              Annual unavailable
            </button>
          </div>
          <p className="max-w-xl text-sm text-white/55">
            Annual billing is not offered yet, so there is no annual discount to apply.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-4 items-stretch">
          {plans.map((plan, index) => {
            const isCurrentPlan = currentPlan.toLowerCase() === plan.name.toLowerCase();
            return (
              <div 
                key={plan.name}
                className="flex h-full w-full flex-col"
              >
                <PricingCard
                  title={plan.name}
                  price={plan.price}
                  billingLabel={plan.billingLabel}
                  minutes={plan.minutes}
                  icon={plan.icon}
                  accent={plan.accent}
                  accentRgb={plan.accentRgb}
                  badge={plan.badge}
                  featured={plan.featured}
                  available={plan.available}
                  features={plan.features}
                  isCurrentPlan={isCurrentPlan}
                  actionLabel={plan.actionLabel}
                  index={index}
                  onUpgrade={() => {
                    if (plan.id === "free") {
                      onNavigate("chat");
                      return;
                    }
                    if (plan.id !== "starter") return;
                    posthog.capture("upgrade_clicked", { planId: plan.id, price: plan.price });
                    onUpgrade(plan.id);
                  }}
                />
              </div>
            );
          })}
        </div>

        <section className="mt-20 border-t border-white/10 pt-10" aria-labelledby="compare-plans-title">
          <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="void-kicker mb-3">Feature comparison</p>
              <h2 id="compare-plans-title" className="text-3xl font-semibold text-white">
                What every plan includes
              </h2>
            </div>
            <p className="max-w-lg text-sm leading-6 text-white/55">
              Growth and Pro are previews only. Their prices and availability may change before launch.
            </p>
          </div>
          <div className="overflow-x-auto border-y border-white/10">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-white">
                  <th className="px-4 py-4 font-medium">Feature</th>
                  {plans.map((plan) => (
                    <th key={plan.id} className="px-4 py-4 font-semibold">{plan.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-white/65">
                {comparisonRows.map((row) => (
                  <tr key={row.label}>
                    <th className="px-4 py-4 font-medium text-white/80">{row.label}</th>
                    {row.values.map((value, index) => (
                      <td key={`${row.label}-${plans[index].id}`} className="px-4 py-4">
                        {typeof value === "boolean" ? (
                          value ? (
                            <Check className="text-emerald-400" size={18} aria-label="Included" />
                          ) : (
                            <CircleMinus className="text-white/30" size={18} aria-label="Not included" />
                          )
                        ) : value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-20 grid gap-10 border-y border-white/10 py-12 lg:grid-cols-[0.8fr_1.2fr]" aria-labelledby="billing-faq-title">
          <div>
            <p className="void-kicker mb-3">Billing FAQ</p>
            <h2 id="billing-faq-title" className="text-3xl font-semibold text-white">
              Clear before checkout
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/55">
              Payment is handled by Razorpay. EchoMind never charges automatically when free minutes run out.
            </p>
          </div>
          <div className="divide-y divide-white/10 border-t border-white/10">
            {billingFaqs.map((faq) => (
              <details key={faq.question} className="group py-5">
                <summary className="cursor-pointer list-none pr-8 text-base font-semibold text-white marker:content-none">
                  {faq.question}
                </summary>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-16 flex flex-col gap-6 border-b border-white/10 pb-12 md:flex-row md:items-center md:justify-between" aria-labelledby="enterprise-title">
          <div>
            <p className="void-kicker mb-3">For organisations</p>
            <h2 id="enterprise-title" className="text-3xl font-semibold text-white">
              Need a custom arrangement?
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
              Contact us about team access, custom voice allowances, invoicing, or deployment requirements.
            </p>
          </div>
          <a
            href="mailto:support@echomind.ai?subject=EchoMind%20organisation%20plan"
            className="inline-flex min-h-11 shrink-0 items-center justify-center bg-white px-5 py-3 text-sm font-semibold text-black transition-colors hover:bg-teal-100"
          >
            Contact us
          </a>
        </section>

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
