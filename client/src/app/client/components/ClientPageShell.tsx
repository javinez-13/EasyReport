"use client";

import { ReactNode, useEffect, useState } from "react";
import { clientApi } from "@/services/api";
import type { AuthUser } from "@/lib/types";
import { ClientTopBar } from "./ClientTopBar";
import { ClientSidebar } from "./ClientSidebar";

export function ClientPageShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    }

    clientApi
      .getProfile()
      .then((profile) => {
        setUser(profile);
        localStorage.setItem("user", JSON.stringify(profile));
      })
      .catch(() => undefined);
  }, []);

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <ClientTopBar rightSlot="home" />
      <div className="mx-auto flex max-w-[1400px] flex-col lg:min-h-[calc(100vh-72px)] lg:flex-row">
        <ClientSidebar user={user} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {title ? (
            <div className="mb-5">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
              {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
            </div>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}
