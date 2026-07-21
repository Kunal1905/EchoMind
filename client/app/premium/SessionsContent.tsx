"use client";

import { Check, Crown, Sparkles, Zap } from "lucide-react";
import { motion } from "motion/react";
import { usePostHog } from "posthog-js/react";
import ConstellationField from "../components/ConstellationField";

type SessionsContentProps = {
  onNavigate?: (page: string) => void;
  onUpgrade?: (calls?: number, planName?: string, price?: string) => void | Promise<void>;
  isPremium?: boolean;
};


const plans = [
  {
    name: "Basic",
    price: "₹249",
    minutes: 30,
    accent: "#15846e",
  },
  {
    name: "Pro",
    price: "₹499",
    minutes: 60,
    accent: "#8052ff",
  },
  {
    name: "Premium",
    price: "₹999",
    minutes: 120,
    accent: "#ffb829",
  },
];

export function SessionsContent({
  onNavigate = () => {},
  onUpgrade = async () => {},
  isPremium = false,
}: SessionsContentProps) {
  const posthog = usePostHog();
  return (
    <main className="void-page pt-24 pb-24 text-white">
      <ConstellationField density="ambient" className="fixed opacity-45" />
      <section className="void-section">
        <div className="mb-16 grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-end">
          <div>
            <div className="void-kicker mb-5 inline-flex items-center gap-2">
            <Crown size={16} />
            {isPremium ? "Premium active" : "Upgrade your EchoMind sessions"}
            </div>
            <h1 className="void-display max-w-4xl">
              Choose the time your reflection needs.
            </h1>
          </div>
          <p className="void-copy">
            Add more guided voice time and keep your session history available as your reflection practice grows.
          </p>
        </div>

        <div className="grid gap-10 md:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.article
              key={plan.name}
              className="void-panel border-t void-hairline pt-8"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ delay: index * 0.08 }}
            >
              <div className="mb-8 flex h-12 w-12 items-center justify-center" style={{ color: plan.accent }}>
                <Sparkles size={28} />
              </div>
              <h2 className="void-subheading mb-3">{plan.name}</h2>
              <p className="void-copy mb-7">{plan.minutes} minutes of EchoMind voice sessions</p>
              <div className="mb-6 flex items-end gap-2">
                <span className="text-5xl font-normal tracking-[-0.04em]">{plan.price}</span>
                <span className="pb-1 text-[--color-ash-gray]">one time</span>
              </div>
              <ul className="mb-8 space-y-3 text-sm text-[--color-silver-mist]">
                <li className="flex gap-2">
                  <Check className="mt-0.5 shrink-0 text-[--color-saffron-spark]" size={16} />
                  AI-generated session summaries
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 shrink-0 text-[--color-saffron-spark]" size={16} />
                  Mood timeline and private history
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 shrink-0 text-[--color-saffron-spark]" size={16} />
                  Secure account-based storage
                </li>
              </ul>
              <button
                onClick={() => {
                  posthog.capture("upgrade_clicked", { planId: plan.name, price: plan.price });
                  onUpgrade(Math.ceil(plan.minutes / 10), plan.name, plan.price);
                }}
                className="void-pill w-full"
              >

                <Zap size={18} />
                Add {plan.minutes} minutes
              </button>
            </motion.article>
          ))}
        </div>

        <div className="mt-10 text-center">
          <button
            onClick={() => onNavigate("home")}
            className="void-ghost"
          >
            Back to home
          </button>
        </div>
      </section>
    </main>
  );
}

export default SessionsContent;
