import type { CalendarEvent } from "../../types/calendar.types";

/**
 * Test factory for a UI-mapped CalendarEvent. Default starts at 09:00 UTC so
 * the local date stays 2026-06-15 in the test timezone (no midnight crossing).
 */
export function makeCalendarEvent(over: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: "e1",
    profileId: "p1",
    organizationId: "o1",
    branchId: "b1",
    type: "MEETING",
    visibility: "ORGANIZATION",
    title: "Team sync",
    description: null,
    startsAt: "2026-06-15T09:00:00.000Z",
    endsAt: "2026-06-15T10:00:00.000Z",
    allDay: false,
    procedureId: null,
    procedureName: null,
    patientId: null,
    patientName: null,
    createdByName: null,
    assistants: [],
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    ...over,
  };
}
