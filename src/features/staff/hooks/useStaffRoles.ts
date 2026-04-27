"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchRoles } from "../lib/staff.api";
import { mapApiRoleToFilter } from "../lib/staff.utils";

export function useStaffRoles(enabled = true) {
  return useQuery({
    queryKey: ["staff-roles"],
    queryFn: async () => {
      const roles = await fetchRoles();
      return roles.map(mapApiRoleToFilter);
    },
    enabled,
    staleTime: 10 * 60 * 1000,
  });
}
