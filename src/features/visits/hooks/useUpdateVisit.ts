"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { financialQueryKeys } from "@/core/financial/api";
import { updateVisit } from "../lib/visits.api";
import type { UpdateVisitRequest } from "../types/visits.api.types";

export type { UpdateVisitRequest };

export function useUpdateVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      visitId,
      body,
    }: {
      visitId: string;
      body: UpdateVisitRequest;
      branchId?: string | null;
    }) => updateVisit({ visitId, body }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.visits.all() });
      qc.invalidateQueries({ queryKey: queryKeys.visits.byId(vars.visitId) });
      qc.invalidateQueries({ queryKey: queryKeys.calendar.all() });
      // A service change re-bills the case invoice, so refresh the billing side too.
      qc.invalidateQueries({ queryKey: financialQueryKeys.charges.all() });
      qc.invalidateQueries({ queryKey: financialQueryKeys.invoices.all() });
    },
  });
}