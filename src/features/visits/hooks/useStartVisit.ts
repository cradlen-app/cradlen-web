"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { startVisit } from "../lib/visits.api";

export function useStartVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ branchId, visitId }: { branchId: string; visitId: string }) =>
      startVisit({ branchId, visitId }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.visits.all() });
      qc.invalidateQueries({ queryKey: queryKeys.visits.byId(vars.visitId) });
    },
  });
}