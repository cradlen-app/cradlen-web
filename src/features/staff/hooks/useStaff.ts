"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAllStaff } from "../lib/staff.api";
import { mapApiStaffToMember } from "../lib/staff.utils";

export function useStaff(organizationId: string | undefined, roleId?: string) {
  return useQuery({
    queryKey: ["staff", organizationId, roleId ?? "all"],
    queryFn: async () => {
      const staff = await fetchAllStaff(organizationId!, roleId);
      return staff.map(mapApiStaffToMember);
    },
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000,
  });
}
