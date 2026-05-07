"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchTodaysSchedule } from "../lib/visits.api";
import { mapApiScheduleEvent } from "../lib/visits.utils";
import { queryKeys } from "@/lib/queryKeys";

type Params = {
  branchId: string | null | undefined;
  date: string;
  assignedToMe?: boolean;
};

export function useTodaysSchedule({ branchId, date, assignedToMe }: Params) {
  return useQuery({
    queryKey: queryKeys.visits.schedule(branchId ?? "", date, assignedToMe ?? false),
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
