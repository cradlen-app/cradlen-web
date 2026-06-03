"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchProfiles } from "../data/patient-portal.api";
import { patientPortalQueryKeys } from "../queryKeys";
import { usePatientProfileStore } from "../store/patientProfileStore";

/** All profiles the account can view (self + dependents). */
export function usePatientProfiles() {
  return useQuery({
    queryKey: patientPortalQueryKeys.profiles(),
    queryFn: fetchProfiles,
    staleTime: 5 * 60 * 1000,
  });
}

/** The currently active patient profile id (self or a dependent). */
export function useActivePatientId(): string {
  return usePatientProfileStore((s) => s.activeProfileId);
}

/** The resolved active profile object, or undefined while loading. */
export function useActiveProfile() {
  const activeId = useActivePatientId();
  const { data: profiles } = usePatientProfiles();
  return profiles?.find((p) => p.id === activeId);
}
