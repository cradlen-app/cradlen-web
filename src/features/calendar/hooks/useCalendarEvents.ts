// TEMP: API integration disabled during kernel refactor. Restore from git history when re-integrating.
"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { mockCalendarEvents } from "../lib/calendar.mock";

type Params = {
  branchId?: string;
  from: string;
  to: string;
};

export function useCalendarEvents({ branchId, from, to }: Params) {
  return useSuspenseQuery({
    queryKey: queryKeys.calendar.events(branchId, from, to),
    queryFn: async () => mockCalendarEvents,
    staleTime: Infinity,
  });
}
