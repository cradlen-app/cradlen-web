"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCalendarEvent } from "../lib/calendar.api";
import { queryKeys } from "@/lib/queryKeys";
import { getApiErrorMessage } from "@/lib/error";
import { toast } from "sonner";
import type { CreateCalendarEventRequest } from "../types/calendar.api.types";
import type { Conflict } from "../types/calendar.types";

type Options = {
  onSuccess?: (conflicts: Conflict[]) => void;
};

export function useCreateCalendarEvent({ onSuccess }: Options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCalendarEventRequest) => createCalendarEvent(body),
    onSuccess: async ({ conflicts }) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.calendar.all(),
        refetchType: "all",
      });
      onSuccess?.(conflicts);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to create event"));
    },
  });
}
