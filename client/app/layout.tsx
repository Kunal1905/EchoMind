import type { Metadata } from "next";
import {
  ClerkProvider
} from "@clerk/nextjs";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import { PHProvider } from "./PHProvider";
import "./styles/globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.echomind.co.in"),
  title: {
    default: "EchoMind - AI-Powered Mental Wellness & Reflection App",
    template: "%s | EchoMind",
  },
  description: "Echo Mind is your AI-powered mental wellness companion. Reflect, track your mood, and build healthier thought patterns — start free today.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: "EchoMind",
    title: "EchoMind - A private place to speak",
    description:
      "A voice-first AI companion for private emotional reflection, mood check-ins, and session summaries.",
    images: [
      {
        url: "/og-echomind.png",
        width: 1200,
        height: 630,
        alt: "EchoMind - A private place to speak",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EchoMind - A private place to speak",
    description:
      "A voice-first AI companion for private emotional reflection, mood check-ins, and session summaries.",
    images: ["/og-echomind.png"],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-csp-nonce") || "";

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
      <html lang="en" nonce={nonce}>
        <body className={`${inter.variable} antialiased`}>
          <PHProvider>
            {children}
          </PHProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
