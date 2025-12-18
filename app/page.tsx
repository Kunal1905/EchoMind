"use client";

import { useState, useEffect } from "react";
import { Nav } from "./components/Nav";
import { Home } from "./home/page";
import { Chat } from "./echo/[sessionId]/page";
import { History } from "./history/page";
import { Sessions } from "./premium/page";

export default function App() {
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
        const response = await fetch("/api/subscription");
        if (response.ok) {
          const data = await response.json();
          setSubscriptionData(data);
        }
      } catch (error) {
        console.error("Error fetching subscription data:", error);
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

  const handleUpgrade = async (calls: number = 10) => {
    try {
      const response = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addPremiumCalls", calls }),
      });

      if (response.ok) {
        const data = await response.json();
        setSubscriptionData(data);
      }
    } catch (error) {
      console.error("Error upgrading subscription:", error);
    }
  };

 const handleSessionComplete = async () => {
  try {
    // Determine if this was a premium session based on the user's current state
    const isPremiumSession = subscriptionData.isPremium && subscriptionData.premiumCallsRemaining > 0;
    const action = isPremiumSession ? 'usePremiumCall' : 'useFreeCall';
    const response = await fetch('/api/subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    
    if (response.ok) {
      const data = await response.json();
      setSubscriptionData(data);
    }
  } catch (error) {
    console.error('Error updating session count:', error);
  }
};

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen">
      <Nav currentPage={currentPage} onNavigate={handleNavigate} />

      {currentPage === "home" && (
        <Home
          onNavigate={handleNavigate}
          isPremium={subscriptionData.isPremium}
          premiumCalls={subscriptionData.premiumCallsRemaining}
        />
      )}

      {currentPage === "chat" && (
        <Chat
          onNavigate={handleNavigate}
          isPremium={subscriptionData.isPremium}
          premiumCalls={subscriptionData.premiumCallsRemaining}
          freeTrialUsed={subscriptionData.freeTrialUsed}
          freeTrialLimit={subscriptionData.freeTrialLimit}
          onSessionComplete={handleSessionComplete}
        />
      )}

      {currentPage === "history" && (
        <History
          onNavigate={handleNavigate}
          isPremium={subscriptionData.isPremium}
        />
      )}

      {currentPage === "sessions" && (
        <Sessions
          onNavigate={handleNavigate}
          onUpgrade={handleUpgrade}
          isPremium={subscriptionData.isPremium}
        />
      )}
    </div>
  );
}
