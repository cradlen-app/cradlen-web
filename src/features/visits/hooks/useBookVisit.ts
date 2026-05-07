"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bookVisit } from "../lib/visits.api";
import { queryKeys } from "@/lib/queryKeys";
import { getApiErrorMessage } from "@/lib/error";
import { toast } from "sonner";
import type { BookVisitRequest } from "../types/visits.api.types";

export function useBookVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: BookVisitRequest) => bookVisit(body),
    onSuccess: (_, variables) => {
      const branchId = variables.branch_id;
      if (branchId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.visits.branch(branchId) });
      } else {
        queryClient.invalidateQueries({ queryKey: queryKeys.visits.all() });
      }
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to book visit"));
    },
  });
}
