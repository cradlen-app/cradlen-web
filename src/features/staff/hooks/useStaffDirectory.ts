"use client";

import { useMemo, useState } from "react";
import { matchesStaffFilter, matchesStaffSearch } from "../lib/staff.utils";
import type { StaffFilter, StaffMember } from "../types/staff.types";

type UseStaffDirectoryOptions = {
  filter: StaffFilter;
  staff: StaffMember[];
};

export function useStaffDirectory({ filter, staff }: UseStaffDirectoryOptions) {
  const [search, setSearch] = useState("");
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
    search,
    selectedId: visibleSelectedId,
    selectedMember,
    setSearch,
    setSelectedId,
    totalStaff: staff.length,
  };
}
