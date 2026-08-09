import type { Metadata } from "next";
import EchoSessionRoute from "./EchoSessionRoute";

export const metadata: Metadata = {
  title: "Voice Reflection – Echo Mind",
  description: "Begin a new voice reflection session with your AI companion.",
};

export default function EchoSessionPage() {
  return <EchoSessionRoute />;
}
