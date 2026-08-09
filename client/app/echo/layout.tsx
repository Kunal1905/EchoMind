import ProtectedClerkLayout from "../components/ProtectedClerkLayout";

export default function EchoLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedClerkLayout>{children}</ProtectedClerkLayout>;
}
