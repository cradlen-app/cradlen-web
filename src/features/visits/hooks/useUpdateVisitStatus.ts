"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateVisitStatus } from "../lib/visits.api";
import type { VisitStatus } from "../types/visits.types";

export function useUpdateVisitStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ visitId, status }: { visitId: string; status: VisitStatus }) =>
      updateVisitStatus({ visitId, body: { status } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visits"] });
    },
  });
}
