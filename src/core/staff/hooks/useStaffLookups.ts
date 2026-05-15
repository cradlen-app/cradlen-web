"use client";

import { useQuery } from "@tanstack/react-query";
import { listBranches } from "@/features/settings/lib/settings.api";
import { queryKeys } from "@/lib/queryKeys";
import { fetchJobFunctions, fetchSpecialties } from "../lib/staff.api";

export function useJobFunctions(enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.lookups.jobFunctions(),
    queryFn: fetchJobFunctions,
    enabled,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useSpecialties(enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.lookups.specialties(),
    queryFn: fetchSpecialties,
    enabled,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

/**
 * Full branch list for the org — needed for the multi-branch picker because
 * the staff list response only returns `{id, name, city, governorate}`.
 */
export function useOrgBranches(
  organizationId: string | undefined,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: queryKeys.settings.branches(organizationId ?? ""),
    queryFn: () => listBranches(organizationId!),
    enabled: enabled && !!organizationId,
    staleTime: 5 * 60 * 1000,
  });
}
