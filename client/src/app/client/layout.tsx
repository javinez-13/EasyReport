import { ReactNode } from "react";
import ClientAuthGate from "./components/ClientAuthGate";
import { GabayAIWidget } from "./components/GabayAIWidget";

export const metadata = {
  title: "Barangay EasyReport - Resident Portal",
  description: "Resident client portal for Barangay EasyReport",
};

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <ClientAuthGate>
      <div className="min-h-screen bg-[#F3F4F6] text-[#1E293B]">
        {children}
        <GabayAIWidget />
      </div>
    </ClientAuthGate>
  );
}
