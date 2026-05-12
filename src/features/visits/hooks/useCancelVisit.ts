"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelVisit } from "../lib/visits.api";
import { queryKeys } from "@/lib/queryKeys";
import { getApiErrorMessage } from "@/common/errors/error";
import { toast } from "sonner";

export function useCancelVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ branchId, visitId }: { branchId: string; visitId: string }) =>
      cancelVisit({ branchId, visitId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.visits.all(),
        refetchType: "all",
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to cancel visit"));
    },
  });
}
