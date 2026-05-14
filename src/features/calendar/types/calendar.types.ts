export type CalendarEventType = "DAY_OFF" | "PROCEDURE" | "MEETING" | "GENERIC";
export type CalendarVisibility = "PRIVATE" | "ORGANIZATION";

export type CalendarAssistant = {
  profileId: string;
  fullName: string;
};

export type CalendarEvent = {
  id: string;
  profileId: string;
  organizationId: string;
  branchId: string | null;
  type: CalendarEventType;
  visibility: CalendarVisibility;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  procedureId: string | null;
  procedureName: string | null;
  patientId: string | null;
  patientName: string | null;
  assistants: CalendarAssistant[];
  createdAt: string;
  updatedAt: string;
};

export type ProcedureLookupItem = {
  id: string;
  code: string;
  name: string;
  specialty: { id: string; code: string; name: string } | null;
};
