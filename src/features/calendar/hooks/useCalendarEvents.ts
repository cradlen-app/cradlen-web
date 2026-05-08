"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { fetchCalendarEvents } from "../lib/calendar.api";
import { queryKeys } from "@/lib/queryKeys";

type Params = {
  branchId?: string;
  from: string;
  to: string;
};

export function useCalendarEvents({ branchId, from, to }: Params) {
  return useSuspenseQuery({
    queryKey: queryKeys.calendar.events(branchId, from, to),
    queryFn: () =>
      typeof window === "undefined"
        ? []
        : fetchCalendarEvents({ branchId, from, to }),
    staleTime: 0,
  });
}
