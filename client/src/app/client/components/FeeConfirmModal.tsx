"use client";

import Image from "next/image";

type FeeConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  onProceed: () => void;
};

export function FeeConfirmModal({ open, onClose, onProceed }: FeeConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/45 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white px-6 pb-6 pt-8 text-center shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full px-2 text-xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close"
        >
          ×
        </button>

        <div className="mx-auto mb-5 flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-slate-200">
          <Image
            src="/barangaylogo.jpg"
            alt="Barangay Gabi Cordova Official Seal"
            width={112}
            height={112}
            className="h-full w-full object-cover"
            priority
          />
        </div>

        <p className="text-lg font-bold text-slate-900 sm:text-xl">
          &ldquo;Please ready your fee 130pesos&rdquo;
        </p>

        <button
          type="button"
          onClick={onProceed}
          className="mt-6 w-full rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Proceed
        </button>
      </div>
    </div>
  );
}
