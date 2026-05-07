"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelVisit } from "../lib/visits.api";
import { ApiError } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { toast } from "sonner";

export function useCancelVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ branchId, visitId }: { branchId: string; visitId: string }) =>
      cancelVisit({ branchId, visitId }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.visits.branch(variables.branchId) });
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? (error.messages[0] ?? "Failed to cancel visit")
          : "Failed to cancel visit";
      toast.error(message);
    },
  });
}
