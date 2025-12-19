"use client";

import { ChatContent } from "./ChatContent";
import type { ReactElement } from "react";

export default function Chat(): ReactElement {
  return <ChatContent isPremium={false} premiumCalls={0} freeTrialUsed={0} freeTrialLimit={3} />;
}