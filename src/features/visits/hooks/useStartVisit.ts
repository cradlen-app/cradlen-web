"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { startVisit } from "../lib/visits.api";

export function useStartVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ branchId, visitId }: { branchId: string; visitId: string }) =>
      startVisit({ branchId, visitId }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["visits", variables.branchId] });
    },
  });
}
