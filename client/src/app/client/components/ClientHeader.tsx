"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authApi } from "@/services/auth";
import { clientApi } from "@/services/api";
import { MaterialIcon } from "@/components/admin/MaterialIcon";
import type { AuthUser } from "@/lib/types";

const dropdownItems = [
  { label: "Activity Timeline", href: "/client/activity", icon: "timeline" },
  { label: "Notifications", href: "/client/notifications", icon: "notifications" },
  { label: "View Complaints", href: "/client/complaints", icon: "assignment" },
  { label: "View Profile", href: "/client/profile", icon: "account_circle" },
];

const navItems = [
  { label: "Dashboard", href: "/client" },
  { label: "Profile", href: "/client/profile" },
  { label: "Activity Timeline", href: "/client/activity" },
  { label: "Notifications", href: "/client/notifications" },
  { label: "My Complaints", href: "/client/complaints" },
  { label: "File a Complaint", href: "/client/complaints/new" },
];

export function ClientHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const storedUser = typeof window !== "undefined" ? window.localStorage.getItem("user") : null;
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
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
      .catch(() => {
        /* AuthGate handles unauthorized redirects */
      });
  }, []);

  useEffect(() => {
    setOpen(false);
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await authApi.logout();
    router.push("/login");
  };

  const displayName = useMemo(() => user?.fullname || user?.username || "Resident", [user]);
  const initials = useMemo(() => {
    if (!displayName) return "R";
    return (
      displayName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("") || "R"
    );
  }, [displayName]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-xl border border-slate-200 p-2 text-slate-600 lg:hidden"
            onClick={() => setMobileNavOpen((prev) => !prev)}
            aria-label="Toggle navigation"
          >
            <MaterialIcon name="menu" />
          </button>
          <Link href="/client" className="flex items-center gap-3">
            <Image
              src="/logo.jpg"
              alt="Barangay EasyReport"
              width={40}
              height={40}
              className="rounded-2xl object-cover"
            />
            <div>
              <p className="text-sm font-semibold text-slate-900">Barangay EasyReport</p>
              <p className="text-xs text-slate-500">Resident Portal</p>
            </div>
          </Link>
        </div>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => {
            const active =
              item.href === "/client"
                ? pathname === "/client"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-blue-50 text-[#2563EB]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-300 sm:px-4"
            onClick={() => setOpen((prev) => !prev)}
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#2563EB] text-sm font-semibold text-white">
              {initials}
            </span>
            <span className="hidden sm:inline">{displayName}</span>
            <MaterialIcon
              name={open ? "keyboard_arrow_up" : "keyboard_arrow_down"}
              className="text-lg text-slate-600"
            />
          </button>

          {open && (
            <div className="absolute right-0 mt-3 w-72 rounded-3xl border border-slate-200 bg-white p-3 shadow-xl">
              <div className="mb-2 rounded-2xl bg-slate-50 px-3 py-3">
                <p className="text-sm font-semibold text-slate-900">{displayName}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <div className="space-y-1">
                {dropdownItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <MaterialIcon name={item.icon} className="text-base text-[#2563EB]" />
                    {item.label}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-1 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  <MaterialIcon name="logout" className="text-base" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {mobileNavOpen ? (
        <div className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
          <div className="mx-auto flex max-w-[1320px] flex-col gap-1">
            {navItems.map((item) => {
              const active =
                item.href === "/client"
                  ? pathname === "/client"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={`rounded-xl px-3 py-2 text-sm font-medium ${
                    active ? "bg-blue-50 text-[#2563EB]" : "text-slate-700"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl px-3 py-2 text-left text-sm font-medium text-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
