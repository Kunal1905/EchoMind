"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/app/lib/api";
import {
  normalizeSubscriptionAllowance,
  routeForSessionPage,
  type SubscriptionAllowance,
} from "../sessionRoute";
import { ChatContent } from "./ChatContent";

export default function EchoSessionRoute() {
  const router = useRouter();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [allowance, setAllowance] = useState<SubscriptionAllowance | null>(null);
  const [loadError, setLoadError] = useState(false);

  const loadAllowance = useCallback(async () => {
    if (!isSignedIn) return;

    setLoadError(false);

    try {
      const token = await getToken();
      const response = await api.get("/subscription", token ? {
        headers: { Authorization: `Bearer ${token}` },
      } : undefined);
      setAllowance(normalizeSubscriptionAllowance(response.data));
    } catch {
      setLoadError(true);
    }
  }, [getToken, isSignedIn]);

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) void loadAllowance();
  }, [isLoaded, isSignedIn, loadAllowance, router]);

  if (isLoaded && isSignedIn && !allowance && !loadError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white/70">
        <div className="flex items-center gap-3 text-sm" role="status">
          <Loader2 className="animate-spin" size={18} />
          Loading your available session time...
        </div>
      </main>
    );
  }

  if (isSignedIn && (loadError || !allowance)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-5 text-center">
        <div className="max-w-md">
          <h1 className="text-2xl text-white">We couldn&apos;t load your session time.</h1>
          <p className="mt-3 text-sm leading-relaxed text-white/60">
            Check your connection and try again before starting a conversation.
          </p>
          <button
            type="button"
            onClick={() => void loadAllowance()}
            className="void-pill mt-7 min-h-12"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <ChatContent
      isPremium={allowance?.isPremium ?? false}
      premiumCalls={allowance?.minutesRemaining ?? 5}
      freeTrialUsed={allowance?.freeTrialUsed ?? 0}
      freeTrialLimit={allowance?.freeTrialLimit ?? 5}
      onNavigate={(page) => router.push(routeForSessionPage(page))}
      onSessionComplete={loadAllowance}
    />
  );
}
