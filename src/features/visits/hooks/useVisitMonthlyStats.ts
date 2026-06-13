"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  fetchBranchVisitStats,
  fetchOrgVisitStats,
} from "../lib/visits.api";

type UseVisitMonthlyStatsParams = {
  /** OWNER-only: aggregate across the whole org instead of the active branch. */
  orgWide?: boolean;
  /** Required when `orgWide` is true — the organization to aggregate. */
  orgId?: string;
};

/** Monthly visit analytics (total / visits / follow-ups with MoM trend + daily series). */
export function useVisitMonthlyStats(
  branchId: string | undefined,
  params: UseVisitMonthlyStatsParams = {},
) {
  const orgWide = params.orgWide ?? false;
  return useQuery({
    queryKey: queryKeys.visits.monthlyStats(orgWide ? "org" : branchId ?? ""),
    queryFn: async () => {
      const res = orgWide
        ? await fetchOrgVisitStats(params.orgId!)
        : await fetchBranchVisitStats(branchId!);
      return res.data;
    },
    enabled: orgWide ? !!params.orgId : !!branchId,
    staleTime: 30_000,
  });
}
