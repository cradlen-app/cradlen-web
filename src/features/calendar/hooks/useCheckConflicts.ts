// TEMP: API integration disabled during kernel refactor. Restore from git history when re-integrating.
"use client";

import { useMutation } from "@tanstack/react-query";
import type { CheckConflictsRequest } from "../types/calendar.api.types";
import type { Conflict } from "../types/calendar.types";

export function useCheckConflicts() {
  return useMutation({
    mutationFn: async (_body: CheckConflictsRequest): Promise<Conflict[]> => {
      await new Promise((r) => setTimeout(r, 150));
      return [];
    },
  });
}
