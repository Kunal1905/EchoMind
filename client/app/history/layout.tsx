import ProtectedClerkLayout from "../components/ProtectedClerkLayout";

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedClerkLayout>{children}</ProtectedClerkLayout>;
}
