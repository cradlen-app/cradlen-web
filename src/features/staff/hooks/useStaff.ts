"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAllStaff } from "../lib/staff.api";
import { mapApiStaffToMember } from "../lib/staff.utils";

type UseStaffOptions = {
  q?: string;
  roleId?: string;
};

export function useStaff(
  organizationId: string | undefined,
  branchId: string | undefined,
  { q, roleId }: UseStaffOptions = {},
) {
  return useQuery({
    queryKey: ["staff", organizationId, branchId, q, roleId],
    queryFn: async () => {
      const staff = await fetchAllStaff(organizationId!, {
        branchId: branchId!,
        q,
        roleId,
      });
      return staff.map(mapApiStaffToMember);
    },
    enabled: !!organizationId && !!branchId,
    staleTime: 2 * 60 * 1000,
  });
}
