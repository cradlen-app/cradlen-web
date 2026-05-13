"use client";

import { useMemo } from "react";
import { useBranchInProgress, type DoctorGroup } from "./useBranchInProgress";
import { useMedRepBranchInProgress } from "./useMedRepBranchInProgress";
import type { Visit } from "../types/visits.types";

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

export function useUnifiedBranchInProgress(
  branchId: string | null | undefined,
) {
  const patient = useBranchInProgress(branchId);
  const medRep = useMedRepBranchInProgress(branchId);

  const groups = useMemo<DoctorGroup[]>(() => {
    const all: Visit[] = [
      ...(patient.data ?? []),
      ...(medRep.data ?? []),
    ];
    return groupByDoctor(all);
  }, [patient.data, medRep.data]);

  return {
    groups,
    isLoading: patient.isLoading && medRep.isLoading,
    // Surface only when both sides fail; partial failure shows what loaded.
    isError: patient.isError && medRep.isError,
  };
}