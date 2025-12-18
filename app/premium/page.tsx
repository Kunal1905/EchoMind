"use client";

import { SessionsContent } from "./SessionsContent";

// Explicit page component with proper typing
export default function SessionsPage() {
  return (
    <SessionsContent
      isPremium={false}
    />
  );
}