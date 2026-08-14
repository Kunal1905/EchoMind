"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Scale,
  Shield,
  Info,
  Lock,
  Globe,
  DollarSign,
  Ban,
  BookOpen,
  Calendar,
  AlertTriangle
} from "lucide-react";
import { motion } from "motion/react";
import ConstellationField from "../components/ConstellationField";

export default function TermsPage() {
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
            <Scale size={16} />
            Terms of Use Draft
          </div>
          <h1 className="void-heading mb-4">
            EchoMind Terms of Use
          </h1>
          <p className="text-[--color-ash-gray] text-sm">Last updated: {currentDate}</p>
        </header>

        {/* Disclaimer Callout */}
        <div className="mb-8 border-t border-b border-yellow-500/30 py-4 text-sm text-yellow-200/90 leading-relaxed">
          <strong className="text-[--color-saffron-spark]">Important Note:</strong> This is a working draft based on a review of the EchoMind codebase and features. It does not constitute legal advice. Given that EchoMind operates in the wellness field, this document should be reviewed by a qualified lawyer before final publishing.
        </div>

        {/* Content Card */}
        <motion.div
          className="space-y-8 border-t void-hairline pt-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* 1. Acceptance of terms */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-violet-300 flex items-center gap-2">
              <BookOpen size={22} className="text-violet-400 shrink-0" />
              1. Acceptance of terms
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              By creating an account or using EchoMind (the &quot;Service&quot;), you agree to these Terms of Use and our Privacy Policy. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 2. Eligibility */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-violet-300 flex items-center gap-2">
              <Lock size={22} className="text-teal-400 shrink-0" />
              2. Eligibility
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              You must be <strong className="text-white">18 years of age or older</strong> to use EchoMind. By using the Service, you represent and warrant that you meet this requirement.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 3. Description of the Service */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-violet-300 flex items-center gap-2">
              <Info size={22} className="text-violet-400 shrink-0" />
              3. Description of the Service
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              EchoMind is an AI voice companion for general wellness conversation, using conversational techniques (such as CBT-informed prompts, mindfulness, and motivational interviewing style questions) to support emotional reflection.
            </p>
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-200/90 leading-relaxed space-y-2">
              <p>
                <strong className="text-red-400">EchoMind is not a substitute for professional mental health care.</strong> It does not diagnose conditions, prescribe treatment, or provide therapy.
              </p>
              <p>
                EchoMind is not equipped to handle medical or mental health emergencies. If you are in crisis, contact emergency services immediately, or in India, call the iCall helpline: <a href="tel:9152987821" className="underline hover:text-red-300">9152987821</a>. Nothing said by the AI companion should be treated as medical, psychological, or professional advice.
              </p>
            </div>
          </section>

          <hr className="border-white/10" />

          {/* 4. Your account */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-violet-300 flex items-center gap-2">
              <Shield size={22} className="text-teal-400 shrink-0" />
              4. Your account
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              You are responsible for keeping your account credentials secure (secured via Clerk authentication) and for all activity under your account. Notify us immediately if you suspect unauthorized access.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 5. Plans, billing, and refunds */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-violet-300 flex items-center gap-2">
              <DollarSign size={22} className="text-violet-400 shrink-0" />
              5. Plans, billing, and refunds
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              EchoMind offers a free tier with a monthly voice-time allowance and paid plan purchases processed securely via Razorpay:
            </p>

            {/* Plans Table */}
            <div className="overflow-x-auto my-4 rounded-xl border border-white/10 bg-white/[0.01]">
              <table className="w-full text-left text-sm text-gray-300 border-collapse">
                <thead className="bg-white/[0.03] text-xs font-semibold uppercase text-teal-400">
                  <tr>
                    <th className="px-4 py-3 border-b border-white/10">Plan</th>
                    <th className="px-4 py-3 border-b border-white/10">Price</th>
                    <th className="px-4 py-3 border-b border-white/10">Monthly Minutes</th>
                    <th className="px-4 py-3 border-b border-white/10">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  <tr>
                    <td className="px-4 py-3 font-semibold text-white">Free</td>
                    <td className="px-4 py-3">₹0</td>
                    <td className="px-4 py-3">10 minutes</td>
                    <td className="px-4 py-3">Active</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-white">Starter</td>
                    <td className="px-4 py-3">₹399 one-time payment</td>
                    <td className="px-4 py-3">20 minutes</td>
                    <td className="px-4 py-3">Purchasable</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-white">Growth</td>
                    <td className="px-4 py-3">₹799 one-time payment</td>
                    <td className="px-4 py-3">40 minutes</td>
                    <td className="px-4 py-3">Purchasable</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-white">Pro</td>
                    <td className="px-4 py-3">₹1,499 one-time payment</td>
                    <td className="px-4 py-3">75 minutes</td>
                    <td className="px-4 py-3">Purchasable</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <ul className="list-disc pl-6 space-y-2 text-gray-300 text-sm">
              <li>
                <strong className="text-white">Monthly Allowances:</strong> Free and paid plan allowances reset once per calendar month. Starter, Growth, and Pro are available for purchase.
              </li>
              <li>
                <strong className="text-white">Automatic Renewal:</strong> Paid plans are activated through a one-time payment and do not create an automatically recurring debit. The selected plan remains active unless your account arrangement is changed.
              </li>
              <li>
                <strong className="text-white">Refunds:</strong> Subscription payments are non-refundable once the monthly allowance has been activated, except where required by applicable law (such as under consumer protection regulations in India) or if a technical error occurred on our part during the billing process. If you believe you were charged in error, please contact <a href="mailto:support@echomind.ai" className="text-teal-400 hover:underline">support@echomind.ai</a> within 7 days of the transaction.
              </li>
            </ul>
          </section>

          <hr className="border-white/10" />

          {/* 6. Acceptable use */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-violet-300 flex items-center gap-2">
              <Ban size={22} className="text-teal-400 shrink-0" />
              6. Acceptable use
            </h2>
            <p className="text-gray-300 text-sm mb-2">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1.5 text-gray-300 text-sm">
              <li>Use the Service for any unlawful purpose.</li>
              <li>Attempt to extract, reverse-engineer, or bypass the AI companion&apos;s underlying system prompts, configurations, or safety guardrails.</li>
              <li>Attempt to overload, disrupt, rate-limit bypass, or gain unauthorized access to our database or host systems.</li>
              <li>Use the Service to harm, harass, or generate content harmful to minors or any third party.</li>
              <li>Impersonate another person or misrepresent your identity.</li>
            </ul>
            <p className="text-gray-300 text-xs mt-3 leading-relaxed">
              Violation of this section may result in immediate suspension or termination of your account without warning or refund.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 7. Intellectual property */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-violet-300 flex items-center gap-2">
              <BookOpen size={22} className="text-violet-400 shrink-0" />
              7. Intellectual property
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              EchoMind, its branding, logos, and underlying software (including the frontend client and backend Server modules) are owned exclusively by us and are protected by applicable intellectual property laws. These terms do not grant you any ownership rights.
            </p>
            <p className="text-gray-300 text-sm leading-relaxed">
              <strong className="text-white">Your content:</strong> You retain ownership of what you say during sessions. By using the Service, you grant us a limited license to process your conversation (transcribing it transiently, generating a summary, and — with your separate consent in Settings — using past summaries to personalize future conversations) solely to provide the Service to you. We do not store raw voice audio or transcripts (see our Privacy Policy). See our <Link href="/copyright" className="text-teal-400 hover:underline">IP & Copyright Policy</Link> for how we handle third-party IP complaints.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 8. Disclaimers */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-violet-300 flex items-center gap-2">
              <AlertTriangle size={22} className="text-teal-400 shrink-0" />
              8. Disclaimers
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              The Service is provided &quot;as is&quot; without warranties of any kind, express or implied. We do not guarantee that the Service will be uninterrupted, error-free, or that AI-generated responses will always be accurate or appropriate. AI-generated content may occasionally be incorrect or biased — use your independent judgment.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 9. Limitation of liability */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-violet-300 flex items-center gap-2">
              <Scale size={22} className="text-violet-400 shrink-0" />
              9. Limitation of liability
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              To the maximum extent permitted by law, EchoMind and its team are not liable for any indirect, incidental, or consequential damages arising from your use of the Service. Our total liability for any claim is limited to the amount you paid us in the 3 months preceding the claim.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 10. Termination */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-violet-300 flex items-center gap-2">
              <Ban size={22} className="text-teal-400 shrink-0" />
              10. Termination
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              We may suspend or terminate your access to the Service for violation of these Terms. You may stop using the Service, or request deletion of your entire account, at any time (see our Privacy settings to trigger self-service erasure).
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 11. Governing law and disputes */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-violet-300 flex items-center gap-2">
              <Globe size={22} className="text-violet-400 shrink-0" />
              11. Governing law and disputes
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              These Terms are governed by the laws of India. Any disputes arising under these terms will be subject to the exclusive jurisdiction of the courts of <strong className="text-white">Mumbai, Maharashtra, India</strong>.
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 12. Changes to these terms */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-violet-300 flex items-center gap-2">
              <Calendar size={22} className="text-teal-400 shrink-0" />
              12. Changes to these terms
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              We may update these Terms from time to time. We will update the date above, and for material changes, we will make reasonable efforts to notify you directly (e.g. via email or in-app notice).
            </p>
          </section>

          <hr className="border-white/10" />

          {/* 13. Contact */}
          <section className="space-y-4 text-center">
            <h2 className="text-2xl font-semibold text-violet-300">13. Contact us</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              If you have any questions about these Terms of Use, please contact us at:{" "}
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
