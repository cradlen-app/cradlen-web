"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelVisit } from "../lib/visits.api";

export function useCancelVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ branchId, visitId }: { branchId: string; visitId: string }) =>
      cancelVisit({ branchId, visitId }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["visits", variables.branchId] });
    },
  });
}
