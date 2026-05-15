"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchRoles } from "../lib/staff.api";
import { mapApiRoleToFilter } from "../lib/staff.utils";
import { staffQueryKeys } from "../queryKeys";

export function useStaffRoles(
  organizationId: string | undefined,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: staffQueryKeys.roles(organizationId ?? ""),
    queryFn: async () => {
      const roles = await fetchRoles(organizationId!);
      return roles.map(mapApiRoleToFilter);
    },
    enabled: enabled && !!organizationId,
    staleTime: 10 * 60 * 1000,
  });
}
