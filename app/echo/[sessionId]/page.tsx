"use client";

import { ChatContent } from "./ChatContent";

// Explicit page component with proper typing
export default function ChatPage() {
  return (
    <ChatContent
      isPremium={false}
      premiumCalls={0}
      freeTrialUsed={0}
      freeTrialLimit={3}
    />
  );
}