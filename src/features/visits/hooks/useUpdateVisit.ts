"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateVisit, type UpdateVisitRequest } from "../lib/visits.api";
import { queryKeys } from "@/lib/queryKeys";
import { getApiErrorMessage } from "@/lib/error";

export function useUpdateVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      visitId,
      body,
    }: {
      visitId: string;
      body: UpdateVisitRequest;
      branchId?: string | null;
    }) => updateVisit({ visitId, body }),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.visits.all(),
        refetchType: "all",
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.visits.byId(variables.visitId),
        refetchType: "all",
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to update visit"));
    },
  });
}
