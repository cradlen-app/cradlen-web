"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { deleteCalendarEvent } from "../lib/calendar.api";

type Options = {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
};

export function useDeleteCalendarEvent({ onSuccess, onError }: Options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCalendarEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all() });
      onSuccess?.();
    },
    onError,
  });
}
