"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { fetchCalendarEvents } from "../lib/calendar.api";

type Params = {
  branchId?: string;
  from: string;
  to: string;
};

export function useCalendarEvents({ branchId, from, to }: Params) {
  return useSuspenseQuery({
    queryKey: queryKeys.calendar.events(branchId, from, to),
    queryFn: () => fetchCalendarEvents({ from, to, branchId }),
    staleTime: 60 * 1000,
  });
}
