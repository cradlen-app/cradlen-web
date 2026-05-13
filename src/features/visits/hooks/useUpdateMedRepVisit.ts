"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { updateMedRepVisit } from "../lib/medical-rep.api";
import type { UpdateMedicalRepVisitRequest } from "../types/visits.api.types";

export function useUpdateMedRepVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      visitId,
      body,
    }: {
      visitId: string;
      body: UpdateMedicalRepVisitRequest;
    }) => updateMedRepVisit({ visitId, body }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.medicalRepVisits.all() });
      qc.invalidateQueries({
        queryKey: queryKeys.medicalRepVisits.byId(vars.visitId),
      });
      qc.invalidateQueries({ queryKey: queryKeys.calendar.all() });
    },
  });
}