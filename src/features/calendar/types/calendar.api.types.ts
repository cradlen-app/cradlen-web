export type ApiCalendarEventType = "SURGERY" | "MEETING" | "PERSONAL" | "LEAVE";
export type ApiParticipantRole = "PRIMARY_DOCTOR" | "ASSISTANT" | "ATTENDEE";
export type ApiCalendarEventStatus = "SCHEDULED" | "CANCELLED" | "COMPLETED";

export type ApiCalendarParticipant = {
  id: string;
  profile_id: string;
  role: ApiParticipantRole;
  name?: string;
};

export type ApiCalendarEvent = {
  id: string;
  organization_id: string;
  branch_id: string | null;
  created_by_id: string;
  patient_id: string | null;
  patient: { id: string; full_name: string } | null;
  type: ApiCalendarEventType;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  all_day: boolean;
  status: ApiCalendarEventStatus;
  details: Record<string, unknown>;
  participants: ApiCalendarParticipant[];
  created_at: string;
  updated_at: string;
};

export type ApiConflict = {
  profile_id: string;
  kind: "EVENT" | "VISIT" | "OUT_OF_SCHEDULE";
  ref_id?: string;
  starts_at?: string;
  ends_at?: string;
  summary: string;
};

export type ApiCalendarEventsResponse = {
  data: ApiCalendarEvent[];
  meta: Record<string, unknown>;
};

export type ApiCalendarEventResponse = {
  data: ApiCalendarEvent;
  meta: Record<string, unknown>;
};

export type ApiCreateEventResponse = {
  data: { event: ApiCalendarEvent; conflicts: ApiConflict[] };
  meta: Record<string, unknown>;
};

export type ApiConflictCheckResponse = {
  data: { conflicts: ApiConflict[] };
  meta: Record<string, unknown>;
};

export type CreateCalendarEventRequest = {
  type: ApiCalendarEventType;
  title: string;
  description?: string;
  starts_at: string;
  ends_at: string;
  all_day?: boolean;
  branch_id?: string;
  patient_id?: string;
  details?: Record<string, unknown>;
  participants?: Array<{ profile_id: string; role: ApiParticipantRole }>;
};

export type UpdateCalendarEventRequest = Partial<
  Omit<CreateCalendarEventRequest, "type">
>;

export type CheckConflictsRequest = {
  starts_at: string;
  ends_at: string;
  participant_profile_ids: string[];
  exclude_event_id?: string;
};
