"use client";

import { ChatContent } from "./ChatContent";

export default function Chat() {
  return <ChatContent isPremium={false} premiumCalls={0} freeTrialUsed={0} freeTrialLimit={3} />;
}