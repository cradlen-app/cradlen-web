"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAllStaff, fetchStaffMember } from "../lib/staff.api";
import { mapApiStaffToMember } from "../lib/staff.utils";
import type { StaffMemberResponse } from "../types/staff.api.types";

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

function unwrapStaffMember(response: StaffMemberResponse) {
  return "data" in response ? response.data : response;
}

export function useStaffMember(
  organizationId: string | undefined,
  branchId: string | undefined,
  staffId: string | null,
) {
  return useQuery({
    queryKey: ["staff", "detail", organizationId, branchId, staffId],
    queryFn: async () =>
      mapApiStaffToMember(
        unwrapStaffMember(
          await fetchStaffMember(staffId!, {
            branchId: branchId!,
            organizationId: organizationId!,
          }),
        ),
      ),
    enabled: !!organizationId && !!branchId && !!staffId,
    staleTime: 60 * 1000,
  });
}
