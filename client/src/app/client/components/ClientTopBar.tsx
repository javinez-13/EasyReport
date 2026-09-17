"use client";

import Image from "next/image";
import Link from "next/link";
import { MaterialIcon } from "@/components/admin/MaterialIcon";
import { mediaUrl } from "@/lib/media";

type ClientTopBarProps = {
  rightSlot?: "avatar" | "home";
  avatarInitials?: string;
  avatarUrl?: string | null;
  onAvatarClick?: () => void;
};

export function ClientTopBar({
  rightSlot = "home",
  avatarInitials = "R",
  avatarUrl,
  onAvatarClick,
}: ClientTopBarProps) {
  const resolvedAvatar = mediaUrl(avatarUrl);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/client" className="flex shrink-0 items-center">
          <Image
            src="/easyreport-logo.png"
            alt="Barangay EasyReport"
            width={220}
            height={56}
            className="h-12 w-auto object-contain sm:h-14"
            priority
          />
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/client/notifications"
            className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200"
            aria-label="Notifications"
          >
            <MaterialIcon name="notifications" className="text-[22px]" />
          </Link>

          {rightSlot === "home" ? (
            <Link
              href="/client"
              className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-slate-800 text-white shadow-sm transition hover:bg-slate-700"
              aria-label="Go to dashboard"
            >
              <MaterialIcon name="home" className="text-[22px]" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={onAvatarClick}
              className="relative inline-flex h-11 w-11 cursor-pointer items-center justify-center overflow-visible rounded-full bg-[#2563EB] text-sm font-bold text-white shadow-sm ring-2 ring-white"
              aria-label="Open profile menu"
            >
              <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full">
                {resolvedAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={resolvedAvatar} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  avatarInitials
                )}
              </span>
              <span className="absolute -bottom-0.5 -right-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 shadow-sm ring-2 ring-white">
                <MaterialIcon name="expand_more" className="text-[14px] leading-none text-white" />
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
