import type { Metadata } from "next";
import HomeContent from "./HomeContent";

export const metadata: Metadata = {
  title: "Voice Reflection Home",
  description:
    "Start a private EchoMind voice reflection and explore mood check-ins, summaries, and optional conversation continuity.",
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return <HomeContent isPremium={false} premiumCalls={10} />;
}
