"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateVisitStatus } from "../lib/visits.api";
import { queryKeys } from "@/lib/queryKeys";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/common/errors/error";
import type { VisitStatus } from "../types/visits.types";

export function useUpdateVisitStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      visitId,
      status,
    }: {
      visitId: string;
      status: VisitStatus;
      branchId: string;
    }) => updateVisitStatus({ visitId, body: { status } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.visits.all(),
        refetchType: "all",
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to update visit status"));
    },
  });
}
