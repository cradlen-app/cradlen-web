"use client";

import { useParams } from "next/navigation";
import { buildDashboardUrl } from "@/infrastructure/http/routes";

export function useDashboardPath() {
  const { orgId, branchId } = useParams<{ orgId: string; branchId: string }>();
  return (path = "") => buildDashboardUrl(orgId, branchId, path);
}
