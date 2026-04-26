"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchStaff } from "../lib/staff.api";
import { mapApiStaffToMember } from "../lib/staff.utils";

export function useStaff(organizationId: string | undefined) {
  return useQuery({
    queryKey: ["staff", organizationId],
    queryFn: async () => {
      const res = await fetchStaff(organizationId!);
      return res.data.map(mapApiStaffToMember);
    },
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000,
  });
}
