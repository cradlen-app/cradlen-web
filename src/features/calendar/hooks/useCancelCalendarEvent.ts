"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelCalendarEvent } from "../lib/calendar.api";
import { queryKeys } from "@/lib/queryKeys";
import { getApiErrorMessage } from "@/common/errors/error";
import { toast } from "sonner";

export function useCancelCalendarEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelCalendarEvent(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.calendar.all(),
        refetchType: "all",
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to cancel event"));
    },
  });
}
