import type { Metadata } from "next";
import {
  ClerkProvider
} from "@clerk/nextjs";
import { Inter } from "next/font/google";
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.variable} antialiased`}>
          <PHProvider>
            {children}
          </PHProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
