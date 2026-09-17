"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { complaintsApi } from "@/services/api";
import { normalizeStatus } from "@/lib/complaint-utils";

export default function ComplaintDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  useEffect(() => {
    complaintsApi
      .getById(id)
      .then((c) => {
        if (!c) {
          router.replace("/admin/complaints");
          return;
        }
        const normStatus = normalizeStatus(c.status);
        const stage = c.latestHearingNumber && c.latestHearingNumber > 0 ? c.latestHearingNumber : 1;

        switch (normStatus) {
          case "Pending":
            router.replace(`/admin/complaints/${id}/pending`);
            break;
          case "In Progress":
            router.replace(`/admin/complaints/${id}/progress`);
            break;
          case "Scheduled":
            router.replace(`/admin/complaints/${id}/hearing/${stage}`);
            break;
          case "Resolved":
            router.replace(`/admin/complaints/${id}/resolve/${stage}`);
            break;
          case "Unsettled":
            router.replace(`/admin/complaints/${id}/unsettled`);
            break;
          case "Cancelled":
            router.replace(`/admin/complaints/${id}/cancel`);
            break;
        }
      })
      .catch(() => router.replace("/admin/complaints"));
  }, [id, router]);

  return (
    <div className="flex h-64 items-center justify-center text-gray-500 text-sm font-medium">
      Redirecting to complaint details...
    </div>
  );
}
