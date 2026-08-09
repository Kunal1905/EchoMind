import ProtectedClerkLayout from "../components/ProtectedClerkLayout";

export default function AuthRoutesLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedClerkLayout>{children}</ProtectedClerkLayout>;
}
