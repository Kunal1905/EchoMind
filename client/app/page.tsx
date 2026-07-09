"use client";

import { useState, useEffect } from "react";
import { Nav } from "./components/Nav";
import HomeContent from "./home/HomeContent";
import { ChatContent } from "./echo/[sessionId]/ChatContent";
import { HistoryContent } from "./history/HistoryContent"
import { SessionsContent } from "./premium/SessionsContent";
import api from "./lib/api";
import { usePostHog } from "posthog-js/react";

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

  const handleUpgrade = async (calls: number = 10, planName?: string, price?: string) => {
    try {
      const response = await api.post("/subscription", {
        action: "addMinutes",
        minutes: calls * 10,
        plan: "premium",
      });

      if (response.status >= 200 && response.status < 300) {
        const data = response.data;
        setSubscriptionData({
          freeTrialUsed: data.freeTrialUsed || 0,
          freeTrialLimit: data.freeTrialLimit || 5,
          premiumCallsRemaining: data.premiumCallsRemaining ?? data.minutesRemaining ?? 0,
          premiumCallsTotal: data.premiumCallsTotal ?? data.minutesTotal ?? 0,
          isPremium: data.isPremium || false,
        });

        // Track Payment Completed in PostHog
        posthog.capture("payment_completed", {
          planId: planName || "premium",
          amount: price || (calls * 10).toString(),
        });
      }
    } catch (error) {
      console.error("Error upgrading subscription:", error);
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
          onUpgrade={handleUpgrade}
          isPremium={subscriptionData.isPremium}
        />
      )}
    </div>
  );
}
