"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAllStaff, fetchStaffMember } from "../lib/staff.api";
import { mapApiStaffToMember, mapLegacyApiStaffToMember } from "../lib/staff.utils";
import type { ApiStaffMember, StaffMemberResponse } from "../types/staff.api.types";
import { queryKeys } from "@/lib/queryKeys";

type UseStaffOptions = {
  q?: string;
  roleId?: string;
  branchId?: string;
  role?: string;
};

export function useStaff(
  organizationId: string | undefined,
  _legacyBranchId: string | undefined,
  { q, roleId, branchId, role }: UseStaffOptions = {},
) {
  return useQuery({
    queryKey: queryKeys.staff.list(organizationId ?? "", { q, roleId, branchId, role }),
    queryFn: async () => {
      const staff = await fetchAllStaff(organizationId!, { q, roleId, branchId, role });
      return staff.map(mapApiStaffToMember);
    },
    enabled: !!organizationId,
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
    queryKey: queryKeys.staff.detail(organizationId ?? "", branchId ?? "", staffId ?? ""),
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
