"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { fetchBranchInProgress } from "../lib/visits.api";
import { mapApiVisitToVisit } from "../lib/visits.utils";
import type { Visit } from "../types/visits.types";

export type DoctorGroup = {
  doctorId: string;
  doctorName: string;
  specialty?: string;
  visits: Visit[];
};

function groupByDoctor(visits: Visit[]): DoctorGroup[] {
  const map = new Map<string, DoctorGroup>();
  for (const v of visits) {
    const doctorId = v.assignedDoctorId ?? "unassigned";
    const doctorName = v.assignedDoctorName ?? "Unassigned";
    const existing = map.get(doctorId);
    if (existing) existing.visits.push(v);
    else map.set(doctorId, { doctorId, doctorName, visits: [v] });
  }
  return Array.from(map.values());
}

export function useBranchInProgress(branchId: string | null | undefined) {
  const query = useQuery({
    queryKey: queryKeys.visits.branchInProgress(branchId ?? ""),
    queryFn: async () => {
      const res = await fetchBranchInProgress({
        branchId: branchId!,
        page: 1,
        limit: 100,
      });
      return res.data.map(mapApiVisitToVisit);
    },
    enabled: !!branchId,
  });

  const groups = useMemo(
    () => (query.data ? groupByDoctor(query.data) : []),
    [query.data],
  );

  return { ...query, groups };
}