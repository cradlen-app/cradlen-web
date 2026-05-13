// TEMP: API integration disabled during kernel refactor. Restore from git history when re-integrating.
"use client";

import { useMutation } from "@tanstack/react-query";

export function useCancelCalendarEvent() {
  return useMutation({
    mutationFn: async (id: string) => {
      await new Promise((r) => setTimeout(r, 200));
      return { id };
    },
  });
}
