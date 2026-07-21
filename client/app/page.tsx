"use client";

import { useState, useEffect } from "react";
import { Nav } from "./components/Nav";
import dynamic from "next/dynamic";
import api from "./lib/api";

const HomeContent = dynamic(() => import("./home/HomeContent"), { ssr: false });
const ChatContent = dynamic(() => import("./echo/[sessionId]/ChatContent").then(mod => mod.ChatContent), { ssr: false });
const HistoryContent = dynamic(() => import("./history/HistoryContent").then(mod => mod.HistoryContent), { ssr: false });
const SessionsContent = dynamic(() => import("./premium/SessionsContent").then(mod => mod.SessionsContent), { ssr: false });
const SettingsContent = dynamic(() => import("./settings/SettingsContent").then(mod => mod.SettingsContent), { ssr: false });
import { usePostHog } from "posthog-js/react";
import { useAuth } from "@clerk/nextjs";

const FREE_TRIAL_LIMIT = 5;

const defaultSubscriptionData = {
  freeTrialUsed: 0,
  freeTrialLimit: FREE_TRIAL_LIMIT,
  premiumCallsRemaining: FREE_TRIAL_LIMIT,
  premiumCallsTotal: FREE_TRIAL_LIMIT,
  isPremium: false,
};

const loadRazorpayCheckout = () =>
  new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Razorpay checkout can only load in the browser."));
      return;
    }

    if ((window as any).Razorpay) {
      resolve();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Razorpay checkout failed to load.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay checkout failed to load."));
    document.head.appendChild(script);
  });

export default function Home() {
  const posthog = usePostHog();
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [currentPage, setCurrentPage] = useState("home");

  const [subscriptionData, setSubscriptionData] = useState(defaultSubscriptionData);
  const [loading, setLoading] = useState(true);

  // Fetch subscription data
  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setSubscriptionData(defaultSubscriptionData);
      setLoading(false);
      return;
    }

    const fetchSubscriptionData = async () => {
      try {
        const token = await getToken();
        const response = await api.get("/subscription", token ? {
          headers: { Authorization: `Bearer ${token}` },
        } : undefined);
        if (response.status >= 200 && response.status < 300) {
          const data = response.data;
          setSubscriptionData({
            freeTrialUsed: data.freeTrialUsed || 0,
            freeTrialLimit: data.freeTrialLimit || FREE_TRIAL_LIMIT,
            premiumCallsRemaining: data.premiumCallsRemaining ?? data.minutesRemaining ?? 0,
            premiumCallsTotal: data.premiumCallsTotal ?? data.minutesTotal ?? FREE_TRIAL_LIMIT,
            isPremium: data.isPremium || false,
          });
        } else {
          console.error("Failed to fetch subscription data:", response.status);
          setSubscriptionData(defaultSubscriptionData);
        }
      } catch (error: any) {
        if (error.response?.status === 401) {
          setSubscriptionData(defaultSubscriptionData);
        } else {
          console.error("Error fetching subscription data:", error);
          setSubscriptionData(defaultSubscriptionData);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionData();
  }, [getToken, isLoaded, isSignedIn]);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpgrade = async (planId: "basic" | "pro" | "premium") => {
    try {
      await loadRazorpayCheckout();

      const token = await getToken();
      const authConfig = token ? {
        headers: { Authorization: `Bearer ${token}` },
      } : undefined;
      const orderRes = await api.post("/subscription/create-order", { planId }, authConfig);
      const { orderId, amount, currency } = orderRes.data;

      const rzp = new (window as any).Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: "EchoMind",
        description: `${planId} plan`,
        order_id: orderId,
        handler: async () => {
          try {
            const sub = await api.get("/subscription", authConfig);
            // ✅ Map server shape correctly — this was also silently broken
            setSubscriptionData({
              premiumCallsRemaining: sub.data.minutesRemaining ?? 0,
              premiumCallsTotal: sub.data.minutesTotal ?? FREE_TRIAL_LIMIT,
              isPremium: sub.data.isPremium ?? false,
              freeTrialUsed: sub.data.freeTrialUsed ?? 0,
              freeTrialLimit: sub.data.freeTrialLimit ?? FREE_TRIAL_LIMIT,
            });
            alert("Payment successful! Your minutes have been added.");
          } catch (e) {
            console.error("Failed to refresh subscription after payment:", e);
            alert("Payment succeeded, but we couldn't refresh your balance. Please reload the page.");
          }
        },
        modal: {
          ondismiss: () => {
            console.log("Razorpay checkout closed by user");
          },
        },
        prefill: { name: "", email: "" },
        theme: { color: "#7C3AED" },
      });

      rzp.on("payment.failed", (response: any) => {
        console.error("Payment failed:", response.error);
        alert(`Payment failed: ${response.error.description || "Please try again."}`);
      });

      rzp.open();
    } catch (err: any) {
      console.error("Upgrade error:", err);
      alert(
        err.response?.data?.error ||
        "Couldn't start the payment process. Please try again in a moment."
      );
    }
  };


  const handleSessionComplete = async () => {
    try {
      const token = await getToken();
      const response = await api.get('/subscription', token ? {
        headers: { Authorization: `Bearer ${token}` },
      } : undefined);

      if (response.status >= 200 && response.status < 300) {
        const data = response.data;
        setSubscriptionData({
          freeTrialUsed: data.freeTrialUsed || 0,
          freeTrialLimit: data.freeTrialLimit || FREE_TRIAL_LIMIT,
          premiumCallsRemaining: data.premiumCallsRemaining ?? data.minutesRemaining ?? 0,
          premiumCallsTotal: data.premiumCallsTotal ?? data.minutesTotal ?? FREE_TRIAL_LIMIT,
          isPremium: data.isPremium || false,
        });
      }
    } catch (error) {
      console.error('Error updating session count:', error);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900">Loading...</div>;
  }

  return (
    <div className="min-h-screen">
      <Nav currentPage={currentPage} onNavigate={handleNavigate} />

      <main>
        {currentPage === "home" && (
          <HomeContent
            onNavigate={handleNavigate}
            isPremium={subscriptionData.isPremium}
            premiumCalls={subscriptionData.premiumCallsRemaining}
          />
        )}

        {currentPage === "chat" && (
          <ChatContent
            onNavigate={handleNavigate}
            isPremium={subscriptionData.isPremium}
            premiumCalls={subscriptionData.premiumCallsRemaining}
            freeTrialUsed={subscriptionData.freeTrialUsed}
            freeTrialLimit={subscriptionData.freeTrialLimit}
            onSessionComplete={handleSessionComplete}
          />
        )}

        {currentPage === "history" && (
          <HistoryContent
            onNavigate={handleNavigate}
            isPremium={subscriptionData.isPremium}
          />
        )}

        {currentPage === "sessions" && (
          <SessionsContent
            onNavigate={handleNavigate}
            onUpgrade={(calls?: number, planName?: string) => {
              const planMap: Record<string, "basic" | "pro" | "premium"> = {
                "basic": "basic",
                "pro": "pro",
                "premium": "premium"
              };
              const mappedPlanId = planName ? planMap[planName.toLowerCase()] : "basic";
              return handleUpgrade(mappedPlanId);
            }}
            isPremium={subscriptionData.isPremium}
          />
        )}

        {currentPage === "settings" && (
          <SettingsContent
            onNavigate={handleNavigate}
          />
        )}
      </main>
    </div>
  );
}
