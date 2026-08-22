"use client";

import { AlertTriangle, Check, CircleMinus, Crown, MessageCircle, RefreshCw, Sparkles, X, Zap } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import ConstellationField from "../components/ConstellationField";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import PricingCard from "./PricingCard";
import { BillingOverview } from "./BillingOverview";

type SessionsContentProps = {
  onNavigate?: (page: string) => void;
  onUpgrade?: (planId: "starter" | "growth" | "pro") => void | Promise<void>;
  isPremium?: boolean;
  currentPlan?: "free" | "starter" | "growth" | "pro";
  checkoutPlanId?: "starter" | "growth" | "pro" | null;
  checkoutError?: {
    message: string;
    planId: "starter" | "growth" | "pro";
    canRetry: boolean;
  } | null;
  onRetryCheckout?: () => void;
  onDismissCheckoutError?: () => void;
};

const plans = [
  {
    id: "free" as const,
    name: "Free",
    price: "₹0",
    billingLabel: "no card required",
    minutes: 5,
    accent: "#E5E7EB",
    accentRgb: "229, 231, 235",
    badge: "ALWAYS AVAILABLE",
    icon: <MessageCircle />,
    featured: false,
    available: true,
    actionLabel: "Start a conversation",
    features: [
      "5 voice conversation minutes each month",
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
    billingLabel: "one-time payment",
    minutes: 40,
    accent: "#8B5CF6", // Premium Purple
    accentRgb: "139, 92, 246",
    badge: "AVAILABLE",
    icon: <Zap />,
    featured: false,
    available: true,
    actionLabel: "Choose Growth",
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
    billingLabel: "one-time payment",
    minutes: 75,
    accent: "#F59E0B", // Luxury Amber/Gold
    accentRgb: "245, 158, 11",
    badge: "AVAILABLE",
    icon: <Crown />,
    featured: false,
    available: true,
    actionLabel: "Choose Pro",
    features: [
      "75 voice conversation minutes each month",
      "Everything in Growth",
      "AI-generated session summaries",
      "Mood timeline and optional memory",
    ],
  },
];

const comparisonRows = [
  { label: "Voice minutes per calendar month", values: ["5", "20", "40", "75"] },
  { label: "Session summaries", values: [true, true, true, true] },
  { label: "Mood history", values: [true, true, true, true] },
  { label: "Optional personalized memory", values: [true, true, true, true] },
  { label: "Available now", values: [true, true, true, true] },
];

const billingFaqs = [
  {
    question: "Is the Free plan a trial?",
    answer:
      "No. Free is an ongoing tier with 5 voice minutes each calendar month. It does not require a payment card and does not automatically convert into a paid plan.",
  },
  {
    question: "What happens when I use all my minutes?",
    answer:
      "New voice conversations pause until your allowance resets in the next calendar month or you choose an available paid plan. Your account and saved history remain available.",
  },
  {
    question: "Do paid plans renew automatically?",
    answer:
      "No. Starter, Growth, and Pro are one-time Razorpay payments, not automatic recurring debits. Your selected plan remains active and its voice allowance resets each calendar month.",
  },
  {
    question: "When do monthly minutes reset?",
    answer:
      "The allowance refreshes when you first use EchoMind in a new calendar month. Unused minutes do not roll over.",
  },
  {
    question: "Can I cancel or request a refund?",
    answer:
      "There is no recurring paid-plan debit to cancel. Payments are generally non-refundable after the allowance is activated, except where required by law or for a billing error. Keep your Razorpay receipt if you need to raise a payment dispute.",
  },
];

export function SessionsContent({
  onNavigate = () => {},
  onUpgrade = async () => {},
  isPremium = false,
  currentPlan = "free",
  checkoutPlanId = null,
  checkoutError = null,
  onRetryCheckout = () => {},
  onDismissCheckoutError = () => {},
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
            Compare monthly voice allowances. Free never auto-charges, and every paid plan is a one-time purchase through Razorpay.
          </p>
        </div>

        {checkoutError && (
          <div className="mb-8 flex flex-col gap-4 border-y border-red-400/30 py-4 text-red-100 sm:flex-row sm:items-center" role="alert">
            <AlertTriangle className="shrink-0 text-red-300" size={20} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Payment needs attention</p>
              <p className="mt-1 text-sm leading-5 text-red-100/70">{checkoutError.message}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {checkoutError.canRetry && (
                <button
                  type="button"
                  onClick={onRetryCheckout}
                  disabled={checkoutPlanId !== null}
                  className="inline-flex min-h-10 items-center gap-2 border border-red-300/30 px-4 text-sm font-semibold text-red-100 transition hover:bg-red-300/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw size={15} /> Try again
                </button>
              )}
              <button
                type="button"
                onClick={onDismissCheckoutError}
                className="inline-flex h-10 w-10 items-center justify-center text-red-100/60 transition hover:text-white"
                aria-label="Dismiss payment message"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div id="pricing-plans" className="scroll-mt-28 grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-4 items-stretch">
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
                  isLoading={checkoutPlanId === plan.id}
                  checkoutDisabled={checkoutPlanId !== null && plan.id !== "free"}
                  actionLabel={plan.actionLabel}
                  index={index}
                  onUpgrade={() => {
                    if (plan.id === "free") {
                      onNavigate("chat");
                      return;
                    }
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
              Every paid plan is a one-time purchase that sets your monthly voice allowance.
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

        <BillingOverview />

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
          <Accordion
            type="single"
            collapsible
            className="border-t border-white/10"
            aria-label="Billing questions"
          >
            {billingFaqs.map((faq, index) => (
              <AccordionItem
                key={faq.question}
                value={`billing-faq-${index + 1}`}
                className="border-white/10"
              >
                <AccordionTrigger className="min-h-16 py-5 text-base font-semibold text-white hover:text-teal-200 hover:no-underline focus-visible:border-teal-400/60 focus-visible:ring-teal-400/25 [&>svg]:mt-0.5 [&>svg]:size-5 [&>svg]:text-white/55">
                  <span className="pr-4">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="max-w-2xl pb-6 pr-10 text-sm leading-6 text-white/65">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
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
