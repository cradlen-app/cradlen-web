"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { updateVisitStatus } from "../lib/visits.api";
import type { VisitStatus } from "../types/visits.types";

export function useUpdateVisitStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      visitId,
      status,
    }: {
      visitId: string;
      status: VisitStatus;
      branchId?: string;
    }) => updateVisitStatus({ visitId, body: { status } }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.visits.all() });
      qc.invalidateQueries({ queryKey: queryKeys.visits.byId(vars.visitId) });
      qc.invalidateQueries({ queryKey: queryKeys.calendar.all() });
    },
  });
}