"use client";

import { ClerkProvider } from "@clerk/nextjs";

export function ClerkAppProvider({
  children,
  nonce,
}: {
  children: React.ReactNode;
  nonce?: string;
}) {
  return (
    <ClerkProvider
      nonce={nonce}
      appearance={{
        variables: {
          colorBackground: "#1e1e2e",
          colorText: "#f5f5f5",
          colorTextSecondary: "#a0a0b0",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
