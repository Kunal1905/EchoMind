"use client";

import { useState, useEffect } from "react";
import { Nav } from "./components/Nav";
import HomeContent from "./home/HomeContent";
import { ChatContent } from "./echo/[sessionId]/ChatContent";
import { HistoryContent } from "./history/HistoryContent"
import { SessionsContent } from "./premium/SessionsContent";
import api from "./lib/api";
import { usePostHog } from "posthog-js/react";
import Script from "next/script";

export default function Home() {
  const posthog = usePostHog();
  const [currentPage, setCurrentPage] = useState("home");

  const [subscriptionData, setSubscriptionData] = useState({
    freeTrialUsed: 0,
    freeTrialLimit: 3,
    premiumCallsRemaining: 0,
    premiumCallsTotal: 0,
    isPremium: false,
  });
  const [loading, setLoading] = useState(true);

  // Fetch subscription data
  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        const response = await api.get("/subscription");
        if (response.status >= 200 && response.status < 300) {
          const data = response.data;
          setSubscriptionData({
            freeTrialUsed: data.freeTrialUsed || 0,
            freeTrialLimit: data.freeTrialLimit || 5,
            premiumCallsRemaining: data.premiumCallsRemaining ?? data.minutesRemaining ?? 0,
            premiumCallsTotal: data.premiumCallsTotal ?? data.minutesTotal ?? 0,
            isPremium: data.isPremium || false,
          });
        } else {
          // Handle error response
          console.error("Failed to fetch subscription data:", response.status);
          // Set default values
          setSubscriptionData({
            freeTrialUsed: 0,
            freeTrialLimit: 3,
            premiumCallsRemaining: 0,
            premiumCallsTotal: 0,
            isPremium: false,
          });
        }
      } catch (error) {
        console.error("Error fetching subscription data:", error);
        // Set default values on error
        setSubscriptionData({
          freeTrialUsed: 0,
          freeTrialLimit: 3,
          premiumCallsRemaining: 0,
          premiumCallsTotal: 0,
          isPremium: false,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionData();
  }, []);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpgrade = async (planId: "basic" | "pro" | "elite") => {
  try {
    // 1. Server creates the order — never trust client with order creation
    const orderRes = await api.post("/subscription/create-order", { planId });
    const { orderId, amount, currency } = orderRes.data;

    // 2. Open Razorpay checkout
    const rzp = new (window as any).Razorpay({
      key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount, currency,
      name:        "EchoMind",
      description: `${planId} plan`,
      order_id:    orderId,
      handler: async () => {
        // Payment verified by webhook — just refresh subscription data
        const sub = await api.get("/subscription");
        setSubscriptionData(sub.data);
      },
      prefill: {
        name:  "",
        email: "",
      },
      theme: { color: "#7C3AED" },
    });
    rzp.open();
  } catch (err) {
    console.error("Upgrade error:", err);
  }
};


  const handleSessionComplete = async () => {
    try {
      const response = await api.get('/subscription');
      
      if (response.status >= 200 && response.status < 300) {
        const data = response.data;
        setSubscriptionData({
          freeTrialUsed: data.freeTrialUsed || 0,
          freeTrialLimit: data.freeTrialLimit || 5,
          premiumCallsRemaining: data.premiumCallsRemaining ?? data.minutesRemaining ?? 0,
          premiumCallsTotal: data.premiumCallsTotal ?? data.minutesTotal ?? 0,
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
            const planMap: Record<string, "basic" | "pro" | "elite"> = {
              "basic": "basic",
              "pro": "pro", 
              "elite": "elite"
            };
            const mappedPlanId = planName ? planMap[planName.toLowerCase()] : "basic";
            return handleUpgrade(mappedPlanId);
          }}
          isPremium={subscriptionData.isPremium}
        />
      )}
    </div>
  );
}
