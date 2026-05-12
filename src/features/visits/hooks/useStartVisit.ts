"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { startVisit } from "../lib/visits.api";
import { queryKeys } from "@/lib/queryKeys";
import { getApiErrorMessage } from "@/common/errors/error";
import { toast } from "sonner";

export function useStartVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ branchId, visitId }: { branchId: string; visitId: string }) =>
      startVisit({ branchId, visitId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.visits.all(),
        refetchType: "all",
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to start visit"));
    },
  });
}
