import { apiAuthFetch } from "@/infrastructure/http/api";
import { mapApiCalendarEvent } from "./calendar.utils";
import type {
  ApiCalendarEventResponse,
  ApiCalendarEventsResponse,
  ApiProceduresLookupResponse,
  CreateCalendarEventRequest,
  UpdateCalendarEventRequest,
} from "../types/calendar.api.types";
import type {
  CalendarEvent,
  CalendarEventType,
  CalendarVisibility,
  ProcedureLookupItem,
} from "../types/calendar.types";

export type FetchCalendarEventsParams = {
  from: string;
  to: string;
  profileId?: string;
  branchId?: string;
  type?: CalendarEventType;
  visibility?: CalendarVisibility;
  page?: number;
  limit?: number;
};

export async function fetchCalendarEvents(
  params: FetchCalendarEventsParams,
): Promise<CalendarEvent[]> {
  const search = new URLSearchParams({
    from: params.from,
    to: params.to,
  });
  if (params.profileId) search.set("profile_id", params.profileId);
  if (params.branchId) search.set("branch_id", params.branchId);
  if (params.type) search.set("event_type", params.type);
  if (params.visibility) search.set("visibility", params.visibility);
  search.set("limit", String(params.limit ?? 200));
  if (params.page) search.set("page", String(params.page));

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
): Promise<CalendarEvent> {
  const res = await apiAuthFetch<ApiCalendarEventResponse>("/calendar/events", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return mapApiCalendarEvent(res.data);
}

export async function updateCalendarEvent(
  id: string,
  body: UpdateCalendarEventRequest,
): Promise<CalendarEvent> {
  const res = await apiAuthFetch<ApiCalendarEventResponse>(
    `/calendar/events/${id}`,
    { method: "PATCH", body: JSON.stringify(body) },
  );
  return mapApiCalendarEvent(res.data);
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  await apiAuthFetch<void>(`/calendar/events/${id}`, { method: "DELETE" });
}

export async function fetchProcedures(
  search?: string,
): Promise<ProcedureLookupItem[]> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  const path = `/procedures${params.toString() ? `?${params}` : ""}`;
  const res = await apiAuthFetch<ApiProceduresLookupResponse>(path);
  return res.data;
}
