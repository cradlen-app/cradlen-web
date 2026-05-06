"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateVisitStatus } from "../lib/visits.api";
import type { VisitStatus } from "../types/visits.types";

export function useUpdateVisitStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      branchId,
      visitId,
      status,
    }: {
      branchId: string;
      visitId: string;
      status: VisitStatus;
    }) => updateVisitStatus({ branchId, visitId, body: { status } }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["visits", variables.branchId] });
    },
  });
}
