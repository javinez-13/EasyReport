"use client";

import logo from "@/../public/logo.jpg";
import Image from "next/image"
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MaterialIcon } from "./MaterialIcon";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/complaints", label: "Complaints", icon: "assignment" },
  { href: "/admin/reports", label: "Reports", icon: "bar_chart" },
  { href: "/admin/residents", label: "Residents", icon: "people" },

];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin/dashboard") {
      return pathname === "/admin/dashboard" || pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden overlay-enter"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 py-2 flex h-full w-[var(--sidebar-width)] flex-col border-r border-slate-200 bg-[#628141] transition-transform duration-300 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex items-center gap-2 border-b border-slate-200 px-2.5 py-2">

          <Image
            src={logo}
            alt="Barangay Easyreport logo"
            width={500}
            height={500}

          />
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-1.5 py-7 ">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              title={item.label}
              className={`flex items-center gap-2 rounded-md px-2 py-2.5 text-[13px] text-white font-medium ${isActive(item.href)
                ? "bg-black text-black shadow-sm"
                : "text-slate-600 hover:bg-slate-50 hover:text-black"
                }`}
            >
              <MaterialIcon name={item.icon} className="shrink-0 text-base" />
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-1.5">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            <MaterialIcon name="logout" className="text-base" />
            Logout
          </Link>
        </div>
      </aside>
    </>
  );
}
