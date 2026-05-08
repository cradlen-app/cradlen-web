"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchBranchInProgress } from "../lib/visits.api";
import { mapApiVisitToVisit } from "../lib/visits.utils";
import type { ApiVisit } from "../types/visits.api.types";
import type { Visit } from "../types/visits.types";
import { queryKeys } from "@/lib/queryKeys";

export type DoctorGroup = {
  doctorId: string;
  doctorName: string;
  specialty?: string;
  visits: Visit[];
};

type RawRow = { api: ApiVisit; ui: Visit };

export function useBranchInProgress(branchId: string | null | undefined) {
  const query = useQuery({
    queryKey: queryKeys.visits.branchInProgress(branchId ?? ""),
    queryFn: async (): Promise<RawRow[]> => {
      const res = await fetchBranchInProgress({
        branchId: branchId!,
        page: 1,
        limit: 100,
      });
      return res.data.map((api) => ({ api, ui: mapApiVisitToVisit(api) }));
    },
    enabled: !!branchId,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const groups = useMemo<DoctorGroup[]>(() => {
    const rows = query.data ?? [];
    const map = new Map<string, DoctorGroup>();
    for (const { api, ui } of rows) {
      const doctorId = api.assigned_doctor?.id ?? "unassigned";
      const user = api.assigned_doctor?.user;
      const doctorName = user
        ? `${user.first_name} ${user.last_name}`.trim()
        : "Unassigned";
      const existing = map.get(doctorId);
      if (existing) {
        existing.visits.push(ui);
      } else {
        map.set(doctorId, {
          doctorId,
          doctorName,
          specialty: api.assigned_doctor?.specialty ?? undefined,
          visits: [ui],
        });
      }
    }
    return Array.from(map.values());
  }, [query.data]);

  return { ...query, groups };
}
