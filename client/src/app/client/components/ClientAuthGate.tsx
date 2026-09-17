"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/services/auth";

export default function ClientAuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    async function verifyResident() {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          router.replace("/login");
          return;
        }

        const response = await authApi.getMe();
        const role = response.user?.role?.toUpperCase();

        if (!response.user || role !== "RESIDENT") {
          router.replace(role === "ADMIN" ? "/admin/dashboard" : "/login");
          return;
        }

        localStorage.setItem("user", JSON.stringify(response.user));
        setAllowed(true);
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        router.replace("/login");
      } finally {
        setCheckingAuth(false);
      }
    }

    verifyResident();
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F5F7] p-4">
        <div className="rounded-3xl bg-white px-8 py-10 shadow-lg">
          <p className="text-sm font-medium text-slate-700">Checking resident access...</p>
        </div>
      </div>
    );
  }

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}
