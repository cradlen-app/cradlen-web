// TEMP: API integration disabled during kernel refactor. Restore from git history when re-integrating.
"use client";

import { useMutation } from "@tanstack/react-query";
import type { CreateCalendarEventRequest } from "../types/calendar.api.types";
import type { CalendarEvent, Conflict } from "../types/calendar.types";

type Options = {
  onSuccess?: (conflicts: Conflict[]) => void;
};

export function useCreateCalendarEvent({ onSuccess }: Options = {}) {
  return useMutation({
    mutationFn: async (
      body: CreateCalendarEventRequest,
    ): Promise<{ event: CalendarEvent; conflicts: Conflict[] }> => {
      await new Promise((r) => setTimeout(r, 300));
      const now = new Date().toISOString();
      const event: CalendarEvent = {
        id: `mock-${Date.now()}`,
        organizationId: "org-1",
        branchId: body.branch_id ?? null,
        createdById: "user-1",
        patientId: body.patient_id ?? null,
        patientName: null,
        type: body.type,
        title: body.title,
        description: body.description ?? null,
        startsAt: body.starts_at,
        endsAt: body.ends_at,
        allDay: body.all_day ?? false,
        status: "SCHEDULED",
        details: body.details ?? {},
        participants: (body.participants ?? []).map((p, i) => ({
          id: `mock-pa-${i}`,
          profileId: p.profile_id,
          role: p.role,
        })),
        createdAt: now,
        updatedAt: now,
      };
      return { event, conflicts: [] };
    },
    onSuccess: ({ conflicts }) => {
      onSuccess?.(conflicts);
    },
  });
}
