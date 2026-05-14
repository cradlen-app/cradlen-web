"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { updateCalendarEvent } from "../lib/calendar.api";
import type { UpdateCalendarEventRequest } from "../types/calendar.api.types";
import type { CalendarEvent } from "../types/calendar.types";

type Options = {
  onSuccess?: (event: CalendarEvent) => void;
  onError?: (error: unknown) => void;
};

type Vars = { id: string; body: UpdateCalendarEventRequest };

export function useUpdateCalendarEvent({ onSuccess, onError }: Options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: Vars) => updateCalendarEvent(id, body),
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all() });
      onSuccess?.(event);
    },
    onError,
  });
}
