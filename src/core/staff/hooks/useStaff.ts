"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { fetchAllStaff } from "../lib/staff.api";
import { mapApiStaffToMember } from "../lib/staff.utils";
import { staffQueryKeys } from "../queryKeys";

type UseStaffOptions = {
  search?: string;
  role?: string;
  /** Activation state filter: "active" (default), "inactive", or "all". */
  status?: "active" | "inactive" | "all";
};

export function useStaff(
  organizationId: string | undefined,
  branchId: string | undefined,
  { search, role, status }: UseStaffOptions = {},
) {
  const locale = useLocale();
  return useQuery({
    queryKey: staffQueryKeys.list(organizationId ?? "", {
      search,
      branchId,
      role,
      status,
    }),
    queryFn: async () => {
      const staff = await fetchAllStaff(organizationId!, branchId!, {
        search,
        role,
        status,
      });
      return staff.map((member) => mapApiStaffToMember(member, locale));
    },
    enabled: !!organizationId && !!branchId,
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
