"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect } from "react";

export function PHProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const posthogProjectToken =
      process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN || process.env.NEXT_PUBLIC_POSTHOG_KEY;

    if (posthogProjectToken) {
      posthog.init(posthogProjectToken, {
        api_host: "/pulse",
        ui_host: process.env.NEXT_PUBLIC_POSTHOG_UI_HOST || "https://eu.posthog.com",
        defaults: "2026-05-30",
        capture_pageview: true,
        capture_pageleave: true,
        session_recording: { maskAllInputs: true },
      });
    }
  }, []);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
