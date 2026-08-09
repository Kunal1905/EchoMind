import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IP & Copyright Policy",
  description:
    "Read EchoMind's intellectual property, permitted-use, copyright, and infringement-reporting policy.",
  alternates: {
    canonical: "/copyright",
  },
};

export default function CopyrightLayout({ children }: { children: React.ReactNode }) {
  return children;
}
