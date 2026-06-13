"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchBranchStaffStats } from "../lib/staff.api";
import { staffQueryKeys } from "../queryKeys";

/** Branch staff analytics (total + per-role + clinical, each with MoM trend). */
export function useStaffStats(
  organizationId: string | undefined,
  branchId: string | undefined,
) {
  return useQuery({
    queryKey: staffQueryKeys.stats(organizationId ?? "", branchId ?? ""),
    queryFn: async () => {
      const res = await fetchBranchStaffStats(organizationId!, branchId!);
      return res.data;
    },
    enabled: !!organizationId && !!branchId,
    staleTime: 30_000,
  });
}
