"use client";

import Link from "next/link";
import { ArrowLeft, Shield, CheckCircle, Info, Lock, Share2, Clock, EyeOff, FileText, User } from "lucide-react";
import { motion } from "motion/react";
import ConstellationField from "../components/ConstellationField";

export default function PrivacyPage() {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="void-page pt-20 pb-20 px-4 text-white">
      <ConstellationField density="ambient" className="fixed opacity-30" />
      <div className="relative z-10 mx-auto max-w-3xl">
        {/* Back Link */}
        <div className="mb-8">
          <Link
            href="/"
            className="void-ghost inline-flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>

        {/* Title / Hero */}
        <header className="mb-12 text-center">
          <div className="void-kicker mb-5 inline-flex items-center gap-2">
            <Shield size={16} />
            DPDP Act 2023 Compliant Draft
          </div>
          <h1 className="void-heading mb-4">
            EchoMind Privacy Policy
          </h1>
          <p className="text-[--color-ash-gray] text-sm">Last updated: {currentDate}</p>
        </header>

        {/* Disclaimer Callout */}
        <div className="mb-8 border-t border-b border-yellow-500/30 py-4 text-sm text-yellow-200/90 leading-relaxed">
          <strong className="text-[--color-saffron-spark]">Important Note:</strong> This is a working draft based on a review of the EchoMind codebase. It does not constitute legal advice. Given that EchoMind handles mental-wellness-adjacent conversations and payment data for users in India, it should be reviewed by a legal expert familiar with India&apos;s Digital Personal Data Protection Act, 2023 (&quot;DPDP Act&quot;) before final publishing.
        </div>

        {/* Content Card */}
        <motion.div
          className="space-y-8 border-t void-hairline pt-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Who we are */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-violet-300 flex items-center gap-2">
              <Info size={22} className="text-violet-400" />
              1. Who we are
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              EchoMind (&quot;we,&quot; &quot;us,&quot; &quot;our&quot;) provides an AI voice wellness companion application (the &quot;Service&quot;) accessible via web and mobile. This policy explains what personal data we collect, why, how we protect it, and what rights you have over it.
            </p>
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-200/90 leading-relaxed">
              <strong className="text-red-400">EchoMind is not a medical or mental health service.</strong> It does not diagnose, treat, or provide therapy, and using it does not create a doctor-patient or therapist-client relationship. If you are in crisis or experiencing a medical emergency, contact your local emergency services immediately, or in India, iCall: <a href="tel:9152987821" className="underline hover:text-red-300">9152987821</a>.
            </div>
          </section>

          <hr className="border-white/10" />

          {/* Data we collect */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-violet-300 flex items-center gap-2">
              <CheckCircle size={22} className="text-teal-400" />
              2. Data we collect
            </h2>
            
            <div className="overflow-x-auto my-4 rounded-xl border border-white/10 bg-white/[0.01]">
              <table className="w-full text-left text-sm text-gray-300 border-collapse">
                <thead className="bg-white/[0.03] text-xs font-semibold uppercase text-teal-400">
                  <tr>
                    <th className="px-4 py-3 border-b border-white/10">Category</th>
                    <th className="px-4 py-3 border-b border-white/10">What</th>
                    <th className="px-4 py-3 border-b border-white/10">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  <tr>
                    <td className="px-4 py-3 font-semibold text-white">Account identity</td>
                    <td className="px-4 py-3">Name, email address</td>
                    <td className="px-4 py-3">Collected during sign-up via authentication provider (Clerk)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-white">Session summaries</td>
                    <td className="px-4 py-3">AI-generated summaries of session themes</td>
                    <td className="px-4 py-3">Generated from your conversation, then the original transcript is deleted</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-white">Mood check-ins</td>
                    <td className="px-4 py-3">A self-rated score (1–10)</td>
                    <td className="px-4 py-3">Optionally submitted after a session</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-white">Usage metadata</td>
                    <td className="px-4 py-3">Session duration, timestamps, subscription plan, and minute balance</td>
                    <td className="px-4 py-3">Generated automatically as you use the Service</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-white">Payment records</td>
                    <td className="px-4 py-3">Transaction ID, plan purchased, amount</td>
                    <td className="px-4 py-3">From payment processor (Razorpay) when you make a purchase</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-white">Product analytics</td>
                    <td className="px-4 py-3">Page views, feature usage (not screen recordings, not IP address)</td>
                    <td className="px-4 py-3">Collected via PostHog</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium text-teal-300 flex items-center gap-2 mt-4">
                <EyeOff size={18} />
                What we do NOT retain
              </h3>
              <ul className="list-disc pl-6 space-y-1 text-gray-300 text-sm">
                <li><strong className="text-white">Raw conversation transcripts:</strong> Your spoken conversation is transcribed to generate a session summary, and the transcript is deleted immediately once that summary is created. We retain the summary, not the original transcript.</li>
                <li><strong className="text-white">Audio recordings:</strong> We never capture or store audio files of your voice sessions.</li>
                <li><strong className="text-white">IP addresses:</strong> We do not track or log your IP address or precise location data.</li>
                <li><strong className="text-white">Screen or session recordings:</strong> We do not use tools that record video or recreate your app screen.</li>
              </ul>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-xs text-gray-400 leading-relaxed">
              <strong className="text-white">A note on voice processing:</strong> Your voice is processed in real time by our voice infrastructure provider (Vapi), which in turn uses third-party speech-to-text, text-to-speech, and language-model providers (currently Deepgram, ElevenLabs, and Google) to carry on the conversation. Audio is processed transiently to enable the conversation and is not retained by us after the call ends.
            </div>
          </section>

          <hr className="border-white/10" />

          {/* Why we process your data */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-violet-300 flex items-center gap-2">
              <FileText size={22} className="text-violet-400" />
              3. Why we process your data
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-300 text-sm">
              <li><strong className="text-white">To provide the Service:</strong> Running voice sessions, tracking your minute balance, processing payments.</li>
              <li><strong className="text-white">To personalize your experience:</strong> With your explicit, separate consent, we use summaries of past sessions (and, if you submit them, mood check-ins) to give the AI companion context about previous conversations, so it can reference them naturally. You can withdraw this consent at any time, which stops this personalization going forward.</li>
              <li><strong className="text-white">To operate and improve the Service:</strong> Aggregate, non-identifying product analytics.</li>
              <li><strong className="text-white">To comply with legal obligations:</strong> Retaining payment/transaction records for the period required by applicable tax and financial regulations.</li>
            </ul>
          </section>

          <hr className="border-white/10" />

          {/* Who we share it with */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-violet-300 flex items-center gap-2">
              <Share2 size={22} className="text-teal-400" />
              4. Who we share it with
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              We use the following service providers (sub-processors) to operate EchoMind. Each processes only the data necessary for their function:
            </p>

            <div className="overflow-x-auto my-4 rounded-xl border border-white/10 bg-white/[0.01]">
              <table className="w-full text-left text-sm text-gray-300 border-collapse">
                <thead className="bg-white/[0.03] text-xs font-semibold uppercase text-teal-400">
                  <tr>
                    <th className="px-4 py-3 border-b border-white/10">Provider</th>
                    <th className="px-4 py-3 border-b border-white/10">Purpose</th>
                    <th className="px-4 py-3 border-b border-white/10">Data Involved</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  <tr>
                    <td className="px-4 py-3 font-semibold text-white">Clerk</td>
                    <td className="px-4 py-3">Authentication</td>
                    <td className="px-4 py-3">Name, email</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-white">Vapi (and sub-providers: Deepgram, ElevenLabs, Google)</td>
                    <td className="px-4 py-3">Voice call orchestration, speech-to-text, text-to-speech, conversational AI</td>
                    <td className="px-4 py-3">Live voice audio (transient), conversation content</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-white">Google (Gemini)</td>
                    <td className="px-4 py-3">Session summary generation</td>
                    <td className="px-4 py-3">Session transcript (used once, then deleted)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-white">Razorpay</td>
                    <td className="px-4 py-3">Payment processing</td>
                    <td className="px-4 py-3">Payment details, transaction metadata</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-white">PostHog</td>
                    <td className="px-4 py-3">Product analytics</td>
                    <td className="px-4 py-3">Page views, feature usage (IP and recording disabled)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-white">Neon</td>
                    <td className="px-4 py-3">Database hosting</td>
                    <td className="px-4 py-3">All stored account and session data</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-white">Upstash</td>
                    <td className="px-4 py-3">Caching infrastructure</td>
                    <td className="px-4 py-3">Temporary cached copies of balance/memory data</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-white">Render, Vercel</td>
                    <td className="px-4 py-3">Application hosting</td>
                    <td className="px-4 py-3">All data in transit to/from our servers</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-gray-300 text-xs leading-relaxed">
              We do not sell your personal data, and we do not share it with advertisers. Some of these providers process data outside India. Where that happens, we rely on the contractual and security safeguards those providers offer, consistent with the DPDP Act&apos;s provisions on transfers outside India (which, as of this writing, permits such transfers except to countries specifically restricted by the Central Government).
            </p>
          </section>

          <hr className="border-white/10" />

          {/* How long we keep your data */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-violet-300 flex items-center gap-2">
              <Clock size={22} className="text-violet-400" />
              5. How long we keep your data
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-300 text-sm">
              <li><strong className="text-white">Session summaries and mood check-ins:</strong> Kept until you delete the individual session, or request deletion of your account.</li>
              <li><strong className="text-white">Account profile (name, email, plan):</strong> Kept while your account is active.</li>
              <li><strong className="text-white">Payment/transaction records:</strong> Retained after account deletion for the period required by applicable Indian tax and financial record-keeping laws (retained in a format that is no longer linked to an active account or usable to identify you within the Service).</li>
              <li><strong className="text-white">Raw transcripts:</strong> Not retained — deleted immediately after summary generation.</li>
            </ul>
          </section>

          <hr className="border-white/10" />

          {/* Your rights */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-violet-300 flex items-center gap-2">
              <Shield size={22} className="text-teal-400" />
              6. Your rights
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              Under the DPDP Act, you have the right to:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-gray-300 text-sm">
              <li><strong className="text-white">Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong className="text-white">Correct:</strong> Request correction of inaccurate or outdated data.</li>
              <li><strong className="text-white">Erase:</strong> Request erasure of your data, including deleting individual sessions or your entire account.</li>
              <li><strong className="text-white">Withdraw consent:</strong> Withdraw consent to session-memory personalization at any time, without affecting the lawfulness of processing before withdrawal.</li>
              <li><strong className="text-white">Grievance redressal:</strong> Raise a complaint about how we have handled your data.</li>
            </ul>
            <p className="text-gray-300 text-sm leading-relaxed">
              <strong className="text-white">How to exercise these rights:</strong> You can exercise these rights directly within the application under <Link href="/settings" className="text-teal-400 hover:underline font-semibold">Settings</Link>. There, you can view your stored data, toggle session personalization memory, delete individual sessions, or request complete deletion of all session records. If you are unable to access these controls or need further assistance, you can email us at <a href="mailto:support@echomind.ai" className="text-teal-400 hover:underline">support@echomind.ai</a>, and we will respond and act on requests within 30 days.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* Children's use of the Service */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-violet-300 flex items-center gap-2">
              <Lock size={22} className="text-violet-400" />
              7. Children&apos;s use of the Service
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              EchoMind is intended for users who are <strong className="text-white">18 years of age or older</strong>. We do not knowingly collect data from anyone under 18. If you believe a minor has created an account, contact us and we will delete it.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* Security */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-violet-300 flex items-center gap-2">
              <Shield size={22} className="text-teal-400" />
              8. Security
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              We use industry-standard measures to protect your data, including encrypted connections (HTTPS/TLS) for all data in transit, signature verification on all payment and voice-platform webhooks, rate limiting, and access controls scoping every user&apos;s data to their own account.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* Cookies and tracking */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-violet-300 flex items-center gap-2">
              <Info size={22} className="text-violet-400" />
              9. Cookies and tracking
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              We use essential cookies for authentication (via Clerk) and privacy-respecting product analytics (via PostHog, with IP collection and session recording disabled). We do not use third-party advertising cookies.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* Grievance Officer */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-violet-300 flex items-center gap-2">
              <User size={22} className="text-teal-400" />
              10. Grievance Officer
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              In accordance with the DPDP Act, our designated contact for privacy-related grievances is:
            </p>
            <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4 text-sm text-gray-300 space-y-1">
              <p><strong className="text-white">Title:</strong> Grievance Redressal Officer</p>
              <p><strong className="text-white">Email:</strong> <a href="mailto:privacy@echomind.ai" className="text-teal-400 hover:underline">privacy@echomind.ai</a></p>
              <p><strong className="text-white">Contact Address:</strong> support@echomind.ai (Grievance Support Desk)</p>
            </div>
          </section>

          <hr className="border-white/10" />

          {/* Changes to this policy */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-violet-300">11. Changes to this policy</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              We&apos;ll update the date at the top of this page when this policy changes, and for material changes, we&apos;ll make reasonable efforts to notify you directly (e.g., by email or in-app notice).
            </p>
          </section>

          <hr className="border-white/10" />

          {/* Contact us */}
          <section className="space-y-4 text-center">
            <h2 className="text-2xl font-semibold text-violet-300">12. Contact us</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              If you have any questions about this policy or your data, please contact us at:{" "}
              <a
                href="mailto:support@echomind.ai"
                className="text-teal-400 hover:underline hover:text-teal-300 transition-colors"
              >
                support@echomind.ai
              </a>
            </p>
          </section>
        </motion.div>
      </div>
    </main>
  );
}
