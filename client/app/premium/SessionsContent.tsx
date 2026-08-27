"use client";

import { AlertTriangle, Crown, MessageCircle, RefreshCw, Sparkles, X, Zap } from "lucide-react";
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
  onUpgrade?: (planId: "plus" | "max") => void | Promise<void>;
  isPremium?: boolean;
  currentPlan?: "free" | "plus" | "max" | "starter" | "growth" | "pro";
  checkoutPlanId?: "plus" | "max" | null;
  checkoutError?: {
    message: string;
    planId: "plus" | "max";
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
    badge: "INCLUDED",
    icon: <MessageCircle />,
    featured: false,
    available: true,
    actionLabel: "Start a conversation",
    features: [
      "5 voice minutes every calendar month",
      "AI-generated session summaries",
      "Mood timeline and history",
      "Optional personalized memory",
    ],
  },
  {
    id: "plus" as const,
    name: "Plus",
    price: "₹349",
    billingLabel: "one-time payment",
    minutes: 20,
    accent: "#0D9488", // Modern Teal
    accentRgb: "13, 148, 136",
    badge: "FLEXIBLE",
    icon: <Sparkles />,
    featured: false,
    available: true,
    actionLabel: "Add 20 minutes",
    features: [
      "20 voice minutes added immediately",
      "Minutes never expire",
      "Session summaries and mood history",
      "Optional personalized memory",
    ],
  },
  {
    id: "max" as const,
    name: "Max",
    price: "₹699",
    billingLabel: "one-time payment",
    minutes: 45,
    accent: "#8B5CF6",
    accentRgb: "139, 92, 246",
    badge: "BEST VALUE",
    icon: <Zap />,
    featured: true,
    available: true,
    actionLabel: "Add 45 minutes",
    features: [
      "45 voice minutes added immediately",
      "Minutes never expire",
      "Session summaries and mood history",
      "Optional personalized memory",
    ],
  },
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
      "New voice conversations pause until your free allowance refreshes or you add a voice-minute pack. Your account, summaries, mood history, and settings remain available.",
  },
  {
    question: "Do voice-minute packs renew automatically?",
    answer:
      "No. Plus and Max are one-time Razorpay payments. There is no subscription and no automatic recurring debit.",
  },
  {
    question: "Do paid minutes expire?",
    answer:
      "No. Purchased minutes remain in your balance until you use them. Free monthly minutes refresh only while you are on the Free tier.",
  },
  {
    question: "Can I cancel or request a refund?",
    answer:
      "There is no recurring debit to cancel. Pack purchases are generally non-refundable after minutes are credited, except where required by law or for a billing error. Keep your Razorpay receipt if you need to raise a payment dispute.",
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
              {isPremium ? "Voice balance active" : "More time when you need it"}
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold text-white sm:text-5xl">
              Choose the time you need.
            </h1>
          </div>
          <p className="void-copy text-neutral-400 text-lg leading-relaxed">
            Start free, add 20 minutes for ₹349, or get the best rate with 45 minutes for ₹699. No subscription and no expiring paid balance.
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
        <div id="pricing-plans" className="mx-auto grid max-w-6xl scroll-mt-28 grid-cols-1 items-stretch gap-6 md:grid-cols-3">
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
                  isCurrentPlan={plan.id === "free" && isCurrentPlan}
                  isLoading={checkoutPlanId === plan.id}
                  checkoutDisabled={checkoutPlanId !== null && plan.id !== "free"}
                  actionLabel={plan.id !== "free" && currentPlan === plan.id ? `Add another ${plan.minutes} minutes` : plan.actionLabel}
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
