// TEMP: API integration disabled during kernel refactor. Restore from git history when re-integrating.
"use client";

import { useMutation } from "@tanstack/react-query";

export function useCancelVisit() {
  return useMutation({
    mutationFn: async (_vars: { branchId: string; visitId: string }) => {
      await new Promise((r) => setTimeout(r, 200));
      return { data: { id: _vars.visitId } };
    },
  });
}
