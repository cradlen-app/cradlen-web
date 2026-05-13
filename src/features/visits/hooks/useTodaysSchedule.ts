"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { fetchTodaysSchedule } from "../lib/visits.api";
import { mapApiScheduleEvent } from "../lib/visits.utils";

type Params = {
  branchId: string;
  date: string;
  assignedToMe?: boolean;
};

export function useTodaysSchedule({ branchId, date, assignedToMe }: Params) {
  return useSuspenseQuery({
    queryKey: queryKeys.visits.schedule(branchId, date, assignedToMe ?? false),
    queryFn: async () => {
      const res = await fetchTodaysSchedule({ branchId, date, assignedToMe });
      return res.data.map(mapApiScheduleEvent);
    },
  });
}