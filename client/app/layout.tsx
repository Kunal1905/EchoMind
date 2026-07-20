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
  title: "EchoMind",
  description: "AI-powered mental wellness companion",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-csp-nonce") || "";

  return (
    <ClerkProvider nonce={nonce}>
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
