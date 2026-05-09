export type CalendarEventType = "SURGERY" | "MEETING" | "PERSONAL" | "LEAVE";
export type ParticipantRole = "PRIMARY_DOCTOR" | "ASSISTANT" | "ATTENDEE";
export type CalendarEventStatus = "SCHEDULED" | "CANCELLED" | "COMPLETED";

export type CalendarParticipant = {
  id: string;
  profileId: string;
  role: ParticipantRole;
  name?: string;
};

export type CalendarEvent = {
  id: string;
  organizationId: string;
  branchId: string | null;
  createdById: string;
  patientId: string | null;
  patientName: string | null;
  type: CalendarEventType;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  status: CalendarEventStatus;
  details: Record<string, unknown>;
  participants: CalendarParticipant[];
  createdAt: string;
  updatedAt: string;
};

export type Conflict = {
  profileId: string;
  kind: "EVENT" | "VISIT" | "OUT_OF_SCHEDULE";
  refId?: string;
  startsAt?: string;
  endsAt?: string;
  summary: string;
};
