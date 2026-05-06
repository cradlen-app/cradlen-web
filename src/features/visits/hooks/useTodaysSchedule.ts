"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchTodaysSchedule } from "../lib/visits.api";
import { mapApiScheduleEvent } from "../lib/visits.utils";

type Params = {
  branchId: string | null | undefined;
  date: string;
  assignedToMe?: boolean;
};

export function useTodaysSchedule({ branchId, date, assignedToMe }: Params) {
  return useQuery({
    queryKey: ["visits", branchId, "schedule", date, assignedToMe ?? false],
    queryFn: async () => {
      const res = await fetchTodaysSchedule({
        branchId: branchId!,
        date,
        assignedToMe,
      });
      return res.data.map(mapApiScheduleEvent);
    },
    enabled: !!branchId,
    staleTime: 60_000,
  });
}
