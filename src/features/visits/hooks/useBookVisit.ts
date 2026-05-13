// TEMP: API integration disabled during kernel refactor. Restore from git history when re-integrating.
"use client";

import { useMutation } from "@tanstack/react-query";
import type {
  BookVisitRequest,
  BookVisitResponse,
} from "../types/visits.api.types";

export function useBookVisit() {
  return useMutation({
    mutationFn: async (_body: BookVisitRequest): Promise<BookVisitResponse> => {
      await new Promise((r) => setTimeout(r, 300));
      return {
        data: {
          visit: {
            id: `mock-${Date.now()}`,
            visit_type: "VISIT",
            priority: "NORMAL",
            status: "SCHEDULED",
          },
          patient: {
            id: "mock-patient",
            full_name: "Mock Patient",
          },
          episode: null,
          journey: null,
        },
      };
    },
  });
}
