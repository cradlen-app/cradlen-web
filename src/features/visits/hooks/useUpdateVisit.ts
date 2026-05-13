// TEMP: API integration disabled during kernel refactor. Restore from git history when re-integrating.
"use client";

import { useMutation } from "@tanstack/react-query";
import type { VisitIntake } from "../types/visits.api.types";

export type UpdateVisitRequest = VisitIntake & {
  notes?: string | null;
};

export function useUpdateVisit() {
  return useMutation({
    mutationFn: async (_vars: {
      visitId: string;
      body: UpdateVisitRequest;
      branchId?: string | null;
    }) => {
      await new Promise((r) => setTimeout(r, 200));
      return { data: { id: _vars.visitId } };
    },
  });
}
