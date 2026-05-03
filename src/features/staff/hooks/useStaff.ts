"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAllStaff, fetchStaffMember } from "../lib/staff.api";
import { mapApiStaffToMember, mapLegacyApiStaffToMember } from "../lib/staff.utils";
import type { ApiStaffMember, StaffMemberResponse } from "../types/staff.api.types";

type UseStaffOptions = {
  q?: string;
  roleId?: string;
};

export function useStaff(
  accountId: string | undefined,
  _branchId: string | undefined,
  { q, roleId }: UseStaffOptions = {},
) {
  return useQuery({
    queryKey: ["staff", accountId, q, roleId],
    queryFn: async () => {
      const staff = await fetchAllStaff(accountId!, { q, roleId });
      return staff.map(mapApiStaffToMember);
    },
    enabled: !!accountId,
    staleTime: 2 * 60 * 1000,
  });
}

function unwrapStaffMember(response: StaffMemberResponse): ApiStaffMember {
  return ("data" in response ? response.data : response) as ApiStaffMember;
}

export function useStaffMember(
  organizationId: string | undefined,
  branchId: string | undefined,
  staffId: string | null,
) {
  return useQuery({
    queryKey: ["staff", "detail", organizationId, branchId, staffId],
    queryFn: async () =>
      mapLegacyApiStaffToMember(
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
