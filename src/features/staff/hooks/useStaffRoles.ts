"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchRoles } from "../lib/staff.api";
import { mapApiRoleToFilter } from "../lib/staff.utils";

export function useStaffRoles(organizationId: string | undefined) {
  return useQuery({
    queryKey: ["staff-roles", organizationId],
    queryFn: async () => {
      const roles = await fetchRoles(organizationId!);
      return roles.map(mapApiRoleToFilter);
    },
    enabled: !!organizationId,
    staleTime: 10 * 60 * 1000,
  });
}
