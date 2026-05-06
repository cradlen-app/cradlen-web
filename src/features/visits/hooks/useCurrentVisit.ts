"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCurrentVisit } from "../lib/visits.api";
import { mapApiVisitToVisit } from "../lib/visits.utils";

type Params = {
  branchId: string | null | undefined;
  assignedToMe?: boolean;
};

export function useCurrentVisit({ branchId, assignedToMe }: Params) {
  return useQuery({
    queryKey: ["visits", branchId, "current", assignedToMe ?? false],
    queryFn: async () => {
      const res = await fetchCurrentVisit({
        branchId: branchId!,
        assignedToMe,
      });
      return res.data[0] ? mapApiVisitToVisit(res.data[0]) : null;
    },
    enabled: !!branchId,
    staleTime: 15_000,
  });
}
