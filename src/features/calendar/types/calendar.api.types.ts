import type { CalendarEventType, CalendarVisibility } from "./calendar.types";

export type ApiCalendarEvent = {
  id: string;
  profile_id: string;
  organization_id: string;
  branch_id: string | null;
  event_type: CalendarEventType;
  visibility: CalendarVisibility;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  all_day: boolean;
  procedure_id: string | null;
  patient_id: string | null;
  procedure_name: string | null;
  patient_full_name: string | null;
  assistants: Array<{ profile_id: string; full_name: string }>;
  created_at: string;
  updated_at: string;
};

export type ApiCalendarEventResponse = {
  data: ApiCalendarEvent;
  meta: Record<string, unknown>;
};

export type ApiCalendarEventsResponse = {
  data: ApiCalendarEvent[];
  meta: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
};

export type CreateCalendarEventRequest = {
  event_type: CalendarEventType;
  visibility?: CalendarVisibility;
  title: string;
  description?: string;
  start_at: string;
  end_at: string;
  all_day?: boolean;
  branch_id?: string;
  procedure_id?: string;
  patient_id?: string;
  assistant_profile_ids?: string[];
};

export type UpdateCalendarEventRequest = Partial<CreateCalendarEventRequest>;

export type ApiProcedureLookupItem = {
  id: string;
  code: string;
  name: string;
  specialty: { id: string; code: string; name: string } | null;
};

export type ApiProceduresLookupResponse = {
  data: ApiProcedureLookupItem[];
  meta: Record<string, unknown>;
};
