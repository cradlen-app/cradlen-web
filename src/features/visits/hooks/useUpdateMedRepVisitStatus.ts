"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { updateMedRepVisitStatus } from "../lib/medical-rep.api";
import type { ApiMedicalRepVisitStatus } from "../types/visits.api.types";

export function useUpdateMedRepVisitStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      visitId,
      status,
      reason,
    }: {
      visitId: string;
      status: ApiMedicalRepVisitStatus;
      reason?: string;
    }) =>
      updateMedRepVisitStatus({
        visitId,
        body: { status, ...(reason ? { reason } : {}) },
      }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.medicalRepVisits.all() });
      qc.invalidateQueries({
        queryKey: queryKeys.medicalRepVisits.byId(vars.visitId),
      });
    },
  });
}