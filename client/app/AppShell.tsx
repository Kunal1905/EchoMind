"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Nav } from "./components/Nav";
import { HistoryScreenSkeleton, PlansScreenSkeleton } from "./components/ScreenSkeletons";
import api from "./lib/api";
import { useAuth } from "@clerk/nextjs";

const HomeContent = dynamic(() => import("./home/HomeContent"));
const ChatContent = dynamic(
  () => import("./echo/[sessionId]/ChatContent").then((module) => module.ChatContent),
  { loading: AppScreenLoading }
);
const HistoryContent = dynamic(
  () => import("./history/HistoryContent").then((module) => module.HistoryContent),
  { loading: HistoryScreenSkeleton }
);
const SessionsContent = dynamic(
  () => import("./premium/SessionsContent").then((module) => module.SessionsContent),
  { loading: PlansScreenSkeleton }
);
const SettingsContent = dynamic(
  () => import("./settings/SettingsContent").then((module) => module.SettingsContent),
  { loading: AppScreenLoading }
);

function AppScreenLoading() {
  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-black text-sm text-white/60">
      Loading...
    </div>
  );
}

const FREE_TRIAL_LIMIT = 10;
type PlanId = "free" | "starter" | "growth" | "pro";
type PurchasablePlanId = Exclude<PlanId, "free">;
type CheckoutError = {
  message: string;
  planId: PurchasablePlanId;
  canRetry: boolean;
};

const paidPlanDetails: Record<PurchasablePlanId, { name: string; minutes: number }> = {
  starter: { name: "Starter", minutes: 20 },
  growth: { name: "Growth", minutes: 40 },
  pro: { name: "Pro", minutes: 75 },
};

type ApiError = {
  response?: {
    status?: number;
    data?: {
      error?: string;
    };
  };
};

type RazorpayFailure = {
  error: {
    description?: string;
  };
};

type RazorpaySuccess = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayInstance = {
  on: (event: "payment.failed", handler: (response: RazorpayFailure) => void) => void;
  open: () => void;
};

type RazorpayConstructor = new (options: {
  key: string | undefined;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpaySuccess) => void | Promise<void>;
  modal: {
    ondismiss: () => void;
  };
  prefill: {
    name: string;
    email: string;
  };
  theme: {
    color: string;
  };
}) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

const asApiError = (error: unknown): ApiError =>
  typeof error === "object" && error !== null ? (error as ApiError) : {};

const defaultSubscriptionData = {
  freeTrialUsed: 0,
  freeTrialLimit: FREE_TRIAL_LIMIT,
  premiumCallsRemaining: FREE_TRIAL_LIMIT,
  premiumCallsTotal: FREE_TRIAL_LIMIT,
  isPremium: false,
  plan: "free" as PlanId,
};

const loadRazorpayCheckout = () =>
  new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Razorpay checkout can only load in the browser."));
      return;
    }

    if (window.Razorpay) {
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

export default function AppShell() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [currentPage, setCurrentPage] = useState("home");
  const [checkoutPlanId, setCheckoutPlanId] = useState<PurchasablePlanId | null>(null);
  const [checkoutError, setCheckoutError] = useState<CheckoutError | null>(null);

  const [subscriptionData, setSubscriptionData] = useState(defaultSubscriptionData);

  // Fetch subscription data
  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setSubscriptionData(defaultSubscriptionData);
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
            plan: data.plan || "free",
          });
        } else {
          console.error("Failed to fetch subscription data:", response.status);
          setSubscriptionData(defaultSubscriptionData);
        }
      } catch (error: unknown) {
        const apiError = asApiError(error);
        if (apiError.response?.status === 401) {
          setSubscriptionData(defaultSubscriptionData);
        } else {
          console.error("Error fetching subscription data:", error);
          setSubscriptionData(defaultSubscriptionData);
        }
      }
    };

    fetchSubscriptionData();
  }, [getToken, isLoaded, isSignedIn]);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const handleUpgrade = async (planId: PurchasablePlanId) => {
    if (checkoutPlanId) return;
    setCheckoutPlanId(planId);
    setCheckoutError(null);

    try {
      await loadRazorpayCheckout();

      const token = await getToken();
      const authConfig = token ? {
        headers: { Authorization: `Bearer ${token}` },
      } : undefined;
      const orderRes = await api.post("/subscription/create-order", { planId }, authConfig);
      const { orderId, amount, currency, keyId } = orderRes.data;
      if (!orderId || !amount || !currency || !keyId) {
        throw new Error("The payment order response is incomplete.");
      }

      const Razorpay = window.Razorpay;
      if (!Razorpay) {
        throw new Error("Razorpay checkout failed to load.");
      }

      const plan = paidPlanDetails[planId];
      const rzp = new Razorpay({
        key: keyId,
        amount,
        currency,
        name: "EchoMind",
        description: `${plan.name} plan - ${plan.minutes} voice minutes each month`,
        order_id: orderId,
        handler: async (paymentResponse) => {
          try {
            await api.post(
              "/subscription/verify-payment",
              paymentResponse,
              authConfig
            );

            const sub = await api.get("/subscription", authConfig);
            setSubscriptionData({
              premiumCallsRemaining: sub.data.minutesRemaining ?? 0,
              premiumCallsTotal: sub.data.minutesTotal ?? FREE_TRIAL_LIMIT,
              isPremium: sub.data.isPremium ?? false,
              freeTrialUsed: sub.data.freeTrialUsed ?? 0,
              freeTrialLimit: sub.data.freeTrialLimit ?? FREE_TRIAL_LIMIT,
              plan: sub.data.plan || "free",
            });
            alert(`Payment successful! Your ${plan.name} plan is active.`);
          } catch (e) {
            console.error("Failed to refresh subscription after payment:", e);
            setCheckoutError({
              planId,
              canRetry: false,
              message: "Payment was received, but account confirmation is still pending. Please reload shortly before attempting another payment.",
            });
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

      rzp.on("payment.failed", (response: RazorpayFailure) => {
        console.error("Payment failed:", response.error);
        setCheckoutError({
          planId,
          canRetry: true,
          message: response.error.description || "The payment could not be completed. Check your payment details and try again.",
        });
      });

      rzp.open();
    } catch (err: unknown) {
      const apiError = asApiError(err);
      console.error("Upgrade error:", err);
      setCheckoutError({
        planId,
        canRetry: true,
        message: apiError.response?.data?.error || "Couldn't start the payment process. Please try again in a moment.",
      });
    } finally {
      setCheckoutPlanId(null);
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
          plan: data.plan || "free",
        });
      }
    } catch (error) {
      console.error('Error updating session count:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Nav currentPage={currentPage} onNavigate={handleNavigate} />

      <main className="min-h-screen bg-black">
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
                onUpgrade={handleUpgrade}
                isPremium={subscriptionData.isPremium}
                currentPlan={subscriptionData.plan}
                checkoutPlanId={checkoutPlanId}
                checkoutError={checkoutError}
                onDismissCheckoutError={() => setCheckoutError(null)}
                onRetryCheckout={() => {
                  if (checkoutError?.canRetry) void handleUpgrade(checkoutError.planId);
                }}
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
