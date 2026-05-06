"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createVisit } from "../lib/visits.api";
import type { CreateVisitRequest } from "../types/visits.api.types";

export function useCreateVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      branchId,
      body,
    }: {
      branchId: string;
      body: CreateVisitRequest;
    }) => createVisit({ branchId, body }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["visits", variables.branchId] });
    },
  });
}
