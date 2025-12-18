"use client";

import { HomeContent } from "./HomeContent";

// Explicit page component with proper typing
export default function HomePage() {
  return (
    <HomeContent
      isPremium={false}
      premiumCalls={0}
    />
  );
}