"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { mapApiPatientListItemToPatient } from "@/features/visits/lib/visits.utils";
import type { ApiJourneyStatus } from "@/features/visits/types/visits.api.types";
import { fetchBranchPatients, fetchOrgPatients } from "../lib/patients.api";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Rows per request. The backend caps `limit` at 100 and defaults to this same
 * value, so the page size stays a single source of truth for hook and UI.
 */
export const PATIENTS_PAGE_SIZE = 11;

type UsePatientsParams = {
  search?: string;
  journeyStatus?: ApiJourneyStatus;
  /** OWNER-only: list across the whole org instead of the active branch. */
  orgWide?: boolean;
  /** Doctor's directory: restrict to the caller's own patients (branch only). */
  mine?: boolean;
  /** 1-based page requested from the server. */
  page?: number;
  limit?: number;
};

export function usePatients(branchId: string | undefined, params: UsePatientsParams = {}) {
  const orgWide = params.orgWide ?? false;
  // "Mine" only narrows the branch directory; it never applies to the org-wide view.
  const mine = !orgWide && (params.mine ?? false);
  const page = params.page ?? 1;
  const limit = params.limit ?? PATIENTS_PAGE_SIZE;
  return useQuery({
    // Scope is part of cache identity: "org" vs the branch id.
    queryKey: queryKeys.patients.list(orgWide ? "org" : branchId ?? "", {
      search: params.search,
      journeyStatus: params.journeyStatus,
      mine,
      page,
    }),
    queryFn: async () => {
      const opts = {
        search: params.search || undefined,
        journey_status: params.journeyStatus,
        page,
        limit,
      };
      const res = orgWide
        ? await fetchOrgPatients(opts)
        : await fetchBranchPatients(branchId!, { ...opts, assigned_to_me: mine });
      const total = res.meta.total;
      return {
        patients: res.data.map(mapApiPatientListItemToPatient),
        total,
        // The API has emitted both spellings over time; fall back to deriving it
        // so a missing field never collapses the page count to 1.
        totalPages:
          res.meta.totalPages ??
          res.meta.total_pages ??
          Math.max(1, Math.ceil(total / limit)),
      };
    },
    enabled: orgWide || !!branchId,
    staleTime: 30_000,
    // Keep the previous page on screen while the next one loads, so paging
    // never swaps the table out for the skeleton.
    placeholderData: keepPreviousData,
  });
}
