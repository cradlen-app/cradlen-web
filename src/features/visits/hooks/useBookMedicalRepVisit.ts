// TEMP: API integration disabled during kernel refactor. Restore from git history when re-integrating.
"use client";

import { useMutation } from "@tanstack/react-query";

export function useBookMedicalRepVisit() {
  return useMutation({
    mutationFn: async (_body: Record<string, unknown>) => {
      await new Promise((r) => setTimeout(r, 300));
      return { data: { id: `mock-${Date.now()}` } };
    },
  });
}
