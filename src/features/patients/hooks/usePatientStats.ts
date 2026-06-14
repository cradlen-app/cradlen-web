"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  fetchBranchPatientStats,
  fetchOrgPatientStats,
} from "../lib/patients.api";

type UsePatientStatsParams = {
  /** OWNER-only: aggregate across the whole org instead of the active branch. */
  orgWide?: boolean;
  /** Narrow to the current doctor's own patients (branch scope only). */
  mine?: boolean;
};

/** Patient analytics (total + per-care-path counts with MoM trend). */
export function usePatientStats(
  branchId: string | undefined,
  params: UsePatientStatsParams = {},
) {
  const orgWide = params.orgWide ?? false;
  const mine = !orgWide && (params.mine ?? false);
  return useQuery({
    queryKey: queryKeys.patients.stats(orgWide ? "org" : branchId ?? "", mine),
    queryFn: async () => {
      const res = orgWide
        ? await fetchOrgPatientStats()
        : await fetchBranchPatientStats(branchId!, mine);
      return res.data;
    },
    enabled: orgWide || !!branchId,
    staleTime: 30_000,
  });
}
