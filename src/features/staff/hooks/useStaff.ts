"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { fetchAllStaff } from "../lib/staff.api";
import { mapApiStaffToMember } from "../lib/staff.utils";
import { queryKeys } from "@/lib/queryKeys";

type UseStaffOptions = {
  q?: string;
  roleId?: string;
  branchId?: string;
  role?: string;
  scope?: "org" | "mine";
};

export function useStaff(
  organizationId: string | undefined,
  _legacyBranchId: string | undefined,
  { q, roleId, branchId, role, scope }: UseStaffOptions = {},
) {
  const locale = useLocale();
  return useQuery({
    queryKey: queryKeys.staff.list(organizationId ?? "", { q, roleId, branchId, role, scope }),
    queryFn: async () => {
      const staff = await fetchAllStaff(organizationId!, { q, roleId, branchId, role, scope });
      return staff.map((member) => mapApiStaffToMember(member, locale));
    },
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Backend has no singular `GET /staff/:id` — detail is derived from the cached list.
 * Returns undefined while the list is loading, otherwise the matching member.
 */
export function useStaffMember(
  organizationId: string | undefined,
  branchId: string | undefined,
  staffId: string | null,
) {
  const list = useStaff(organizationId, branchId);
  return {
    ...list,
    data: staffId ? list.data?.find((m) => m.id === staffId) : undefined,
  };
}
