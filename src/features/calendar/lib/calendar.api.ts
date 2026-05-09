import { apiAuthFetch } from "@/lib/api";
import { mapApiCalendarEvent, mapApiConflict } from "./calendar.utils";
import type {
  ApiCalendarEventsResponse,
  ApiCalendarEventResponse,
  ApiCreateEventResponse,
  ApiConflictCheckResponse,
  CreateCalendarEventRequest,
  UpdateCalendarEventRequest,
  CheckConflictsRequest,
} from "../types/calendar.api.types";
import type { CalendarEvent, Conflict } from "../types/calendar.types";

export type FetchCalendarEventsParams = {
  from: string;
  to: string;
  branchId?: string;
  doctorId?: string;
  patientId?: string;
  type?: string;
};

export async function fetchCalendarEvents(
  params: FetchCalendarEventsParams,
): Promise<CalendarEvent[]> {
  const search = new URLSearchParams({ from: params.from, to: params.to });
  if (params.branchId) search.set("branch_id", params.branchId);
  if (params.doctorId) search.set("doctor_id", params.doctorId);
  if (params.patientId) search.set("patient_id", params.patientId);
  if (params.type) search.set("type", params.type);

  const res = await apiAuthFetch<ApiCalendarEventsResponse>(
    `/calendar/events?${search.toString()}`,
  );
  return res.data.map(mapApiCalendarEvent);
}

export async function fetchCalendarEvent(id: string): Promise<CalendarEvent> {
  const res = await apiAuthFetch<ApiCalendarEventResponse>(
    `/calendar/events/${id}`,
  );
  return mapApiCalendarEvent(res.data);
}

export async function createCalendarEvent(
  body: CreateCalendarEventRequest,
): Promise<{ event: CalendarEvent; conflicts: Conflict[] }> {
  const res = await apiAuthFetch<ApiCreateEventResponse>("/calendar/events", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return {
    event: mapApiCalendarEvent(res.data.event),
    conflicts: res.data.conflicts.map(mapApiConflict),
  };
}

export async function updateCalendarEvent(
  id: string,
  body: UpdateCalendarEventRequest,
): Promise<{ event: CalendarEvent; conflicts: Conflict[] }> {
  const res = await apiAuthFetch<ApiCreateEventResponse>(
    `/calendar/events/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
  return {
    event: mapApiCalendarEvent(res.data.event),
    conflicts: res.data.conflicts.map(mapApiConflict),
  };
}

export async function cancelCalendarEvent(id: string): Promise<CalendarEvent> {
  const res = await apiAuthFetch<ApiCalendarEventResponse>(
    `/calendar/events/${id}/cancel`,
    { method: "POST" },
  );
  return mapApiCalendarEvent(res.data);
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  await apiAuthFetch<void>(`/calendar/events/${id}`, { method: "DELETE" });
}

export async function checkConflicts(
  body: CheckConflictsRequest,
): Promise<Conflict[]> {
  const res = await apiAuthFetch<ApiConflictCheckResponse>(
    "/calendar/events/check-conflicts",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
  return res.data.conflicts.map(mapApiConflict);
}
