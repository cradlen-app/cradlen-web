"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateVisitStatus } from "../lib/visits.api";
import { ApiError } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { toast } from "sonner";
import type { VisitStatus } from "../types/visits.types";

export function useUpdateVisitStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ visitId, status }: { visitId: string; status: VisitStatus }) =>
      updateVisitStatus({ visitId, body: { status } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.visits.all() });
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? (error.messages[0] ?? "Failed to update visit status")
          : "Failed to update visit status";
      toast.error(message);
    },
  });
}
