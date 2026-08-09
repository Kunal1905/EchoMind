import { headers } from "next/headers";
import { ClerkAppProvider } from "./ClerkAppProvider";

export default async function ProtectedClerkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = (await headers()).get("x-csp-nonce") || undefined;
  return <ClerkAppProvider nonce={nonce}>{children}</ClerkAppProvider>;
}
