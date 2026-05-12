"use client";

import { useQuery } from "@tanstack/react-query";
import { listBranches } from "@/features/settings/lib/settings.api";
import { queryKeys } from "@/lib/queryKeys";
import { fetchJobFunctions, fetchSpecialties } from "../lib/staff.api";

export function useJobFunctions() {
  return useQuery({
    queryKey: queryKeys.lookups.jobFunctions(),
    queryFn: fetchJobFunctions,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useSpecialties() {
  return useQuery({
    queryKey: queryKeys.lookups.specialties(),
    queryFn: fetchSpecialties,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

/**
 * Full branch list for the org — needed for the multi-branch picker because
 * the staff list response only returns `{id, name, city, governorate}`.
 */
export function useOrgBranches(organizationId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.settings.branches(organizationId ?? ""),
    queryFn: () => listBranches(organizationId!),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  });
}
