// TEMP: API integration disabled during kernel refactor. Restore from git history when re-integrating.
"use client";

import { useMutation } from "@tanstack/react-query";
import type { VisitStatus } from "../types/visits.types";

export function useUpdateVisitStatus() {
  return useMutation({
    mutationFn: async (_vars: {
      visitId: string;
      status: VisitStatus;
      branchId: string;
    }) => {
      await new Promise((r) => setTimeout(r, 200));
      return { data: { id: _vars.visitId, status: _vars.status } };
    },
  });
}
