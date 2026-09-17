"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authApi } from "@/services/auth";
import { MaterialIcon } from "@/components/admin/MaterialIcon";
import type { AuthUser } from "@/lib/types";
import { mediaUrl } from "@/lib/media";

const sidebarItems = [
  { label: "View Profile", href: "/client/profile", icon: "settings" },
  { label: "Activity Timeline", href: "/client/activity", icon: "format_list_bulleted" },
  { label: "View Complaints", href: "/client/complaints", icon: "description" },
];

export function ClientSidebar({ user }: { user: AuthUser | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const displayName = user?.fullname || user?.username || "Resident";
  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "R";
  const avatar = mediaUrl(user?.profilePicture);

  const handleLogout = async () => {
    await authApi.logout();
    router.push("/login");
  };

  return (
    <aside className="w-full shrink-0 border-b border-slate-200 bg-white lg:w-[250px] lg:border-b-0 lg:border-r">
      <div className="px-5 py-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#2563EB] text-sm font-bold text-white">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">{displayName}</p>
          </div>
        </div>

        <nav className="space-y-1">
          {sidebarItems.map((item, index) => {
            const active =
              pathname === item.href ||
              (item.href !== "/client/profile" && pathname.startsWith(item.href));
            return (
              <div key={item.href}>
                {index === 1 ? <div className="my-3 border-t border-slate-200" /> : null}
                <Link
                  href={item.href}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2.5 text-sm font-medium transition ${
                    active ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${
                      active ? "bg-slate-300 text-slate-800" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    <MaterialIcon name={item.icon} className="text-[18px]" />
                  </span>
                  {item.label}
                </Link>
              </div>
            );
          })}

          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-600">
              <MaterialIcon name="logout" className="text-[18px]" />
            </span>
            Log out
          </button>
        </nav>
      </div>
    </aside>
  );
}
