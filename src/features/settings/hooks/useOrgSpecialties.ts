"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { fetchOrgSpecialties } from "../lib/settings.api";

export function useOrgSpecialties(organizationId: string | null | undefined) {
  return useQuery({
    queryKey: organizationId
      ? queryKeys.organizations.specialties(organizationId)
      : (["organizations", "specialties", "disabled"] as const),
    queryFn: async () => {
      const res = await fetchOrgSpecialties(organizationId!);
      return res.data;
    },
    enabled: !!organizationId,
    staleTime: 10 * 60 * 1000,
  });
}
