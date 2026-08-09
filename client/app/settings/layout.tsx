import ProtectedClerkLayout from "../components/ProtectedClerkLayout";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedClerkLayout>{children}</ProtectedClerkLayout>;
}
