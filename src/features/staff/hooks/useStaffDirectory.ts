"use client";

import { useMemo, useState } from "react";
import { matchesStaffFilter, matchesStaffSearch } from "../lib/staff.utils";
import type { StaffFilter, StaffMember } from "../types/staff.types";

type UseStaffDirectoryOptions = {
  filter: StaffFilter;
  search: string;
  staff: StaffMember[];
};

export function useStaffDirectory({ filter, search, staff }: UseStaffDirectoryOptions) {
  const [selectedId, setSelectedId] = useState<string | null>(staff[0]?.id ?? null);

  const filteredStaff = useMemo(
    () =>
      staff.filter(
        (member) =>
          matchesStaffFilter(member, filter) && matchesStaffSearch(member, search),
      ),
    [filter, search, staff],
  );

  const visibleSelectedId = filteredStaff.some((member) => member.id === selectedId)
    ? selectedId
    : filteredStaff[0]?.id ?? null;

  const selectedMember = useMemo(
    () => staff.find((member) => member.id === visibleSelectedId) ?? null,
    [visibleSelectedId, staff],
  );

  return {
    filteredStaff,
    selectedId: visibleSelectedId,
    selectedMember,
    setSelectedId,
    totalStaff: staff.length,
  };
}
