"use client";

import { useQuery } from "@tanstack/react-query";
import { mapApiPatientListItemToPatient } from "@/features/visits/lib/visits.utils";
import type { ApiJourneyStatus } from "@/features/visits/types/visits.api.types";
import { fetchBranchPatients, fetchOrgPatients } from "../lib/patients.api";
import { queryKeys } from "@/lib/queryKeys";

type UsePatientsParams = {
  search?: string;
  journeyStatus?: ApiJourneyStatus;
  /** OWNER-only: list across the whole org instead of the active branch. */
  orgWide?: boolean;
  /** Doctor's directory: restrict to the caller's own patients (branch only). */
  mine?: boolean;
};

export function usePatients(branchId: string | undefined, params: UsePatientsParams = {}) {
  const orgWide = params.orgWide ?? false;
  // "Mine" only narrows the branch directory; it never applies to the org-wide view.
  const mine = !orgWide && (params.mine ?? false);
  return useQuery({
    // Scope is part of cache identity: "org" vs the branch id.
    queryKey: queryKeys.patients.list(orgWide ? "org" : branchId ?? "", {
      search: params.search,
      journeyStatus: params.journeyStatus,
      mine,
    }),
    queryFn: async () => {
      const opts = {
        search: params.search || undefined,
        journey_status: params.journeyStatus,
        limit: 11,
      };
      const res = orgWide
        ? await fetchOrgPatients(opts)
        : await fetchBranchPatients(branchId!, { ...opts, assigned_to_me: mine });
      return {
        patients: res.data.map(mapApiPatientListItemToPatient),
        total: res.meta.total,
      };
    },
    enabled: orgWide || !!branchId,
    staleTime: 30_000,
  });
}
