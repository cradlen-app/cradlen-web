"use client";

import { useParams } from "next/navigation";
import { buildDashboardUrl } from "@/lib/routes";

export function useDashboardPath() {
  const { orgId, branchId } = useParams<{ orgId: string; branchId: string }>();
  return (path = "") => buildDashboardUrl(orgId, branchId, path);
}
