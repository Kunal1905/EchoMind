"use client";

import { Check, Crown, Sparkles, Zap } from "lucide-react";
import { motion } from "motion/react";
import { usePostHog } from "posthog-js/react";

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
    accent: "from-teal-500 to-cyan-500",
  },
  {
    name: "Pro",
    price: "₹499",
    minutes: 60,
    accent: "from-violet-500 to-fuchsia-500",
  },
  {
    name: "Premium",
    price: "₹999",
    minutes: 120,
    accent: "from-amber-500 to-yellow-500",
  },
];

export function SessionsContent({
  onNavigate = () => {},
  onUpgrade = async () => {},
  isPremium = false,
}: SessionsContentProps) {
  const posthog = usePostHog();
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 pt-24 pb-24 px-4 text-white">
      <section className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm text-amber-100">
            <Crown size={16} />
            {isPremium ? "Premium active" : "Upgrade your EchoMind sessions"}
          </div>
          <h1 className="mb-4 bg-gradient-to-r from-amber-300 via-violet-300 to-teal-300 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
            Choose Your Session Pack
          </h1>
          <p className="mx-auto max-w-2xl text-gray-300">
            Add more guided voice time and keep your session history available as your reflection practice grows.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {plans.map((plan) => (
            <motion.article
              key={plan.name}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-xl"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
            >
              <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${plan.accent}`}>
                <Sparkles size={24} />
              </div>
              <h2 className="mb-2 text-2xl font-bold">{plan.name}</h2>
              <p className="mb-5 text-gray-400">{plan.minutes} minutes of EchoMind voice sessions</p>
              <div className="mb-6 flex items-end gap-2">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="pb-1 text-gray-400">one time</span>
              </div>
              <ul className="mb-6 space-y-3 text-sm text-gray-300">
                <li className="flex gap-2">
                  <Check className="mt-0.5 shrink-0 text-teal-300" size={16} />
                  AI-generated session summaries
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 shrink-0 text-teal-300" size={16} />
                  Mood timeline and private history
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 shrink-0 text-teal-300" size={16} />
                  Secure account-based storage
                </li>
              </ul>
              <button
                onClick={() => {
                  posthog.capture("upgrade_clicked", { planId: plan.name, price: plan.price });
                  onUpgrade(Math.ceil(plan.minutes / 10), plan.name, plan.price);
                }}
                className={`flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r ${plan.accent} px-5 py-3 font-semibold text-white transition-transform hover:scale-[1.02]`}
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
            className="text-sm text-gray-400 underline-offset-4 hover:text-gray-200 hover:underline"
          >
            Back to home
          </button>
        </div>
      </section>
    </main>
  );
}

export default SessionsContent;
