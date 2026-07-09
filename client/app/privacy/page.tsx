"use client";

import Link from "next/link";
import { ArrowLeft, Shield, CheckCircle, Info, Lock } from "lucide-react";
import { motion } from "motion/react";

export default function PrivacyPage() {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 pt-20 pb-20 px-4 text-white">
      <div className="mx-auto max-w-3xl">
        {/* Back Link */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>

        {/* Title / Hero */}
        <header className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm text-violet-300">
            <Shield size={16} />
            DPDP Act 2023 Compliant
          </div>
          <h1 className="mb-4 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-teal-400 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
            EchoMind Privacy Notice
          </h1>
          <p className="text-gray-400 text-sm">Last updated: {currentDate}</p>
        </header>

        {/* Content Card */}
        <motion.div
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-xl backdrop-blur-xl space-y-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* What We Collect */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-violet-300 flex items-center gap-2">
              <CheckCircle size={22} className="text-teal-400" />
              What We Collect
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-300 text-sm">
              <li>
                <strong className="text-white">Your name and email:</strong> Collected via Clerk during account sign-up.
              </li>
              <li>
                <strong className="text-white">AI-generated summaries:</strong> Insights from your sessions (never raw audio files or transcripts).
              </li>
              <li>
                <strong className="text-white">Mood scores:</strong> Scores from 1 to 10 generated after session completion to map your timeline.
              </li>
              <li>
                <strong className="text-white">Session duration & timestamps:</strong> Metadatas detailing how long your reflections lasted.
              </li>
              <li>
                <strong className="text-white">Your subscription plan:</strong> Basic, Pro, or Premium status details.
              </li>
            </ul>
          </section>

          <hr className="border-white/10" />

          {/* What We Do NOT Collect */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-red-400 flex items-center gap-2">
              <Lock size={22} className="text-red-400" />
              What We Do NOT Collect
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-300 text-sm">
              <li>Audio recordings of your voice sessions.</li>
              <li>Full conversation transcripts (these are deleted immediately after the summary is generated).</li>
              <li>Location details, IP address tracking, or persistent device identifiers.</li>
            </ul>
          </section>

          <hr className="border-white/10" />

          {/* How We Use Your Data */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-violet-300 flex items-center gap-2">
              <Info size={22} className="text-violet-400" />
              How We Use Your Data
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              Your session summaries are exclusively used to give EchoMind context about your past conversations, allowing the AI companion to reference previous reflections and provide custom emotional insights. This happens only with your active consent.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* Your Rights */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-violet-300 flex items-center gap-2">
              <Shield size={22} className="text-teal-400" />
              Your Rights (Under India's DPDP Act 2023)
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
                <h3 className="font-semibold text-white mb-1 text-sm">Access</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  View and inspect all personal data stored about you via the Settings dashboard.
                </p>
              </div>
              <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
                <h3 className="font-semibold text-white mb-1 text-sm">Delete</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Delete individual session records or request complete deletion of all your data at any time.
                </p>
              </div>
              <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
                <h3 className="font-semibold text-white mb-1 text-sm">Withdraw Consent</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Opt out of session memory and reflection personalization features at any time.
                </p>
              </div>
              <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
                <h3 className="font-semibold text-white mb-1 text-sm">Correct</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Correct or update any inaccurate personal details by contacting support.
                </p>
              </div>
            </div>
          </section>

          <hr className="border-white/10" />

          {/* Data Retention */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-violet-300">Data Retention</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              Session summaries are kept securely until you decide to delete them. Deleting your EchoMind account removes all your data from our active systems and backups within 30 days.
            </p>
          </section>

          {/* Contact */}
          <footer className="pt-6 border-t border-white/10 text-center text-sm text-gray-400">
            For questions or requests regarding your data rights, contact us at:{" "}
            <a
              href="mailto:support@echomind.ai"
              className="text-teal-400 hover:underline hover:text-teal-300 transition-colors"
            >
              support@echomind.ai
            </a>
          </footer>
        </motion.div>
      </div>
    </main>
  );
}
