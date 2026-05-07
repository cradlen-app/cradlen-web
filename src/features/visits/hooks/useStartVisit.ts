"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { startVisit } from "../lib/visits.api";
import { ApiError } from "@/lib/api";
import { toast } from "sonner";

export function useStartVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ branchId, visitId }: { branchId: string; visitId: string }) =>
      startVisit({ branchId, visitId }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["visits", variables.branchId] });
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? (error.messages[0] ?? "Failed to start visit")
          : "Failed to start visit";
      toast.error(message);
    },
  });
}
