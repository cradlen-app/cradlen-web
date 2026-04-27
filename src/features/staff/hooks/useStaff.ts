"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAllStaff } from "../lib/staff.api";
import { mapApiStaffToMember } from "../lib/staff.utils";

export function useStaff(organizationId: string | undefined) {
  return useQuery({
    queryKey: ["staff", organizationId],
    queryFn: async () => {
      const staff = await fetchAllStaff(organizationId!);
      return staff.map(mapApiStaffToMember);
    },
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000,
  });
}
