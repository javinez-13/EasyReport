"use client";

import Image from "next/image";
import { useState } from "react";
import { MaterialIcon } from "@/components/admin/MaterialIcon";

export function GabayAIWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open ? (
        <div className="w-[min(92vw,320px)] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Image
                src="/gabay-ai-logo.png"
                alt="Gabay-AI"
                width={44}
                height={44}
                className="rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-semibold text-slate-900">Gabay-AI</p>
                <p className="mt-0.5 text-xs text-slate-500">Community AI Guide & Assistant</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="cursor-pointer rounded-full bg-slate-100 p-1 text-slate-600 hover:bg-slate-200"
              aria-label="Close Gabay AI"
            >
              <MaterialIcon name="close" className="text-base" />
            </button>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
            Ask for help filing complaints or tracking your case.
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="cursor-pointer overflow-hidden rounded-full shadow-xl transition hover:scale-105"
        aria-label="Open Gabay AI"
      >
        <Image
          src="/gabay-ai-logo.png"
          alt="Gabay-AI"
          width={64}
          height={64}
          className="h-16 w-16 rounded-full object-cover"
          priority
        />
      </button>
    </div>
  );
}
