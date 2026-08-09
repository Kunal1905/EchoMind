import type { Metadata } from "next";
import NotFoundContent from "./components/NotFoundContent";
import { ClerkAppProvider } from "./components/ClerkAppProvider";

export const metadata: Metadata = {
  title: {
    absolute: "Page Not Found - EchoMind",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <ClerkAppProvider>
      <NotFoundContent />
    </ClerkAppProvider>
  );
}
