"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { MessageCircle, Sparkles } from "lucide-react";
import ConstellationField from "./ConstellationField";
import { DisclaimerModal } from "./DisclaimerModal";
import { Nav } from "./Nav";

const navRoutes: Record<string, string> = {
  home: "/",
  chat: "/echo/new",
  history: "/history",
  sessions: "/",
  settings: "/settings",
};

const publicQuickLinks = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Copyright", href: "/copyright" },
];

const focusStyles =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-electric-iris] focus-visible:ring-offset-4 focus-visible:ring-offset-black";

export default function NotFoundContent() {
  const router = useRouter();
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);

  return (
    <div className="void-page pb-24 md:pb-0">
      <Nav
        currentPage=""
        onNavigate={(page) => router.push(navRoutes[page] || "/")}
      />

      <ConstellationField density="ambient" className="fixed opacity-25" />

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-7xl items-center justify-center px-5 pb-16 pt-28 sm:px-8 md:pb-20 md:pt-36">
        <div className="animate-slide-up w-full max-w-[600px] text-center">
          <div
            aria-hidden="true"
            className="relative mx-auto mb-7 flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] opacity-60 sm:h-28 sm:w-28"
          >
            <MessageCircle className="text-[--color-electric-iris]" size={42} strokeWidth={1.25} />
            <Sparkles className="absolute ml-16 -mt-16 text-[--color-saffron-spark]" size={18} strokeWidth={1.5} />
          </div>

          <p
            aria-hidden="true"
            className="text-6xl font-light leading-none text-white/15 sm:text-8xl"
          >
            404
          </p>

          <h1 className="mt-2 text-3xl font-normal text-white sm:text-4xl">
            Not every echo can be found.
          </h1>
          <p className="mx-auto mt-5 max-w-[440px] text-base leading-relaxed text-[--color-silver-mist]">
            The page you are looking for may have moved, changed, or never existed.
            Let&apos;s help you find a familiar way back.
          </p>

          <div className="mt-10 flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center">
            <Link href="/" className={`void-pill min-h-12 ${focusStyles}`}>
              Return home
            </Link>
            <SignedIn>
              <Link
                href="/echo/new"
                className={`void-ghost inline-flex min-h-12 items-center justify-center px-5 ${focusStyles}`}
              >
                Start a conversation
              </Link>
            </SignedIn>
            <SignedOut>
              <Link
                href="/sign-in"
                className={`void-ghost inline-flex min-h-12 items-center justify-center px-5 ${focusStyles}`}
              >
                Sign in to EchoMind
              </Link>
            </SignedOut>
          </div>

          <nav
            aria-label="Explore EchoMind"
            className="mt-14 border-t void-hairline pt-8"
          >
            <p className="void-kicker mb-5">Or explore</p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-4">
              <SignedIn>
                <Link
                  href="/history"
                  className={`text-xs font-semibold uppercase tracking-[0.12em] text-[--color-ash-gray] underline-offset-4 transition-colors hover:text-white hover:underline ${focusStyles}`}
                >
                  View history
                </Link>
              </SignedIn>
              <SignedOut>
                <Link
                  href="/sign-up"
                  className={`text-xs font-semibold uppercase tracking-[0.12em] text-[--color-ash-gray] underline-offset-4 transition-colors hover:text-white hover:underline ${focusStyles}`}
                >
                  Create account
                </Link>
              </SignedOut>
              {publicQuickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-xs font-semibold uppercase tracking-[0.12em] text-[--color-ash-gray] underline-offset-4 transition-colors hover:text-white hover:underline ${focusStyles}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </main>

      <footer className="void-section relative z-10 pt-8">
        <div className="flex flex-col gap-5 border-t void-hairline pt-8 text-sm sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => setDisclaimerOpen(true)}
            className={`text-left text-[--color-ash-gray] transition-colors hover:text-white ${focusStyles}`}
          >
            Mental Health Disclaimer
          </button>
          <div className="flex flex-wrap gap-5 text-[--color-ash-gray]">
            <Link href="/privacy" className={`hover:text-white ${focusStyles}`}>
              Privacy Policy
            </Link>
            <Link href="/terms" className={`hover:text-white ${focusStyles}`}>
              Terms of Use
            </Link>
            <Link href="/copyright" className={`hover:text-white ${focusStyles}`}>
              IP &amp; Copyright
            </Link>
          </div>
        </div>
      </footer>

      <DisclaimerModal
        isOpen={disclaimerOpen}
        onClose={() => setDisclaimerOpen(false)}
      />
    </div>
  );
}
