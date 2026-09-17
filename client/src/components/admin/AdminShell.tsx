"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";


const pageTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/complaints": "Manage Complaints",
  "/admin/reports": "Reports",
  "/admin/residents": "Residents",
  "/admin/settings": "Settings",
};

function getPageTitle(pathname: string): string {
  if (pathname.startsWith("/admin/summon")) return "Generate Summon";
  for (const [path, title] of Object.entries(pageTitles)) {
    if (pathname === path || (path !== "/admin" && pathname.startsWith(path))) {
      return title;
    }
  }
  return "Dashboard";
}

export function AdminShell({
  children,
  pathname,
}: {
  children: React.ReactNode;
  pathname: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-[var(--sidebar-width)]">
        <main className="p-3 sm:p-5 lg:p-6">
          <div className="admin-content">{children}</div>
        </main>
      </div>
    </div>
  );
}
