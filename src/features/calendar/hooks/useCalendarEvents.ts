"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { fetchCalendarEvents } from "../lib/calendar.api";

type Params = {
  branchId?: string;
  from: string;
  to: string;
  /** When set, narrows to this profile's own events ("My calendar" view). */
  profileId?: string;
};

export function useCalendarEvents({ branchId, from, to, profileId }: Params) {
  return useSuspenseQuery({
    queryKey: queryKeys.calendar.events(branchId, from, to, profileId),
    queryFn: () => fetchCalendarEvents({ from, to, branchId, profileId }),
    staleTime: 60 * 1000,
  });
}
