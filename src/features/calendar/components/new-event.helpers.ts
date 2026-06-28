import {
  dayOffEventSchema,
  procedureEventSchema,
  meetingEventSchema,
  genericEventSchema,
  type NewEventFormValues,
} from "../lib/calendar.schemas";
import type {
  CalendarEvent,
  CalendarEventType,
  CalendarVisibility,
} from "../types/calendar.types";
import type {
  CreateCalendarEventRequest,
  UpdateCalendarEventRequest,
} from "../types/calendar.api.types";

const DEFAULT_VISIBILITY: Record<CalendarEventType, CalendarVisibility> = {
  DAY_OFF: "ORGANIZATION",
  PROCEDURE: "ORGANIZATION",
  MEETING: "PRIVATE",
  GENERIC: "PRIVATE",
};

/**
 * The "Who can see this event?" selector collapses the two underlying fields
 * (`branch_id` + `visibility`) into one linear choice so they can never land in
 * a contradictory state (e.g. org-wide + private).
 */
export type Audience = "PRIVATE" | "THIS_BRANCH" | "ORG_WIDE";

export function computeAudience(
  branchId: string | undefined,
  visibility: CalendarVisibility | undefined,
): Audience {
  if (!branchId) return "ORG_WIDE";
  return visibility === "PRIVATE" ? "PRIVATE" : "THIS_BRANCH";
}

export function schemaForType(type: CalendarEventType) {
  switch (type) {
    case "DAY_OFF":
      return dayOffEventSchema;
    case "PROCEDURE":
      return procedureEventSchema;
    case "MEETING":
      return meetingEventSchema;
    case "GENERIC":
      return genericEventSchema;
  }
}

export function toDatetimeLocal(iso: string): string {
  // datetime-local needs `YYYY-MM-DDTHH:MM` in *local* time
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function defaultValuesForType(
  type: CalendarEventType,
  branchId?: string,
): NewEventFormValues {
  const base = {
    title: "",
    description: "",
    start_at: "",
    end_at: "",
    all_day: false,
    visibility: DEFAULT_VISIBILITY[type],
    branch_id: branchId ?? "",
  };
  if (type === "PROCEDURE") {
    return {
      ...base,
      event_type: "PROCEDURE" as const,
      procedure_id: "",
      patient_id: "",
      assistant_profile_ids: [],
    };
  }
  return { ...base, event_type: type } as NewEventFormValues;
}

export function valuesFromEvent(event: CalendarEvent): NewEventFormValues {
  const base = {
    title: event.title,
    description: event.description ?? "",
    start_at: toDatetimeLocal(event.startsAt),
    end_at: toDatetimeLocal(event.endsAt),
    all_day: event.allDay,
    visibility: event.visibility,
    branch_id: event.branchId ?? "",
  };
  if (event.type === "PROCEDURE") {
    return {
      ...base,
      event_type: "PROCEDURE" as const,
      procedure_id: event.procedureId ?? "",
      patient_id: event.patientId ?? "",
      assistant_profile_ids: event.assistants.map((a) => a.profileId),
    };
  }
  return { ...base, event_type: event.type } as NewEventFormValues;
}

export function buildCreateRequest(
  values: NewEventFormValues,
): CreateCalendarEventRequest {
  const base: CreateCalendarEventRequest = {
    event_type: values.event_type,
    title: values.title,
    description: values.description?.trim() || undefined,
    start_at: new Date(values.start_at).toISOString(),
    end_at: new Date(values.end_at).toISOString(),
    all_day: values.all_day || undefined,
    visibility: values.visibility,
    branch_id: values.branch_id?.trim() || undefined,
  };

  if (values.event_type === "PROCEDURE") {
    return {
      ...base,
      procedure_id: values.procedure_id,
      patient_id: values.patient_id?.trim() || undefined,
      assistant_profile_ids:
        (values.assistant_profile_ids ?? []).filter(Boolean).length > 0
          ? (values.assistant_profile_ids ?? []).filter(Boolean)
          : undefined,
    };
  }
  return base;
}

export function buildUpdateRequest(
  values: NewEventFormValues,
  event: CalendarEvent,
): UpdateCalendarEventRequest {
  // For edit we send the full set every time; the backend treats it as a PATCH.
  // Locked: event_type — backend type swaps would invalidate relations.
  const base: UpdateCalendarEventRequest = {
    title: values.title,
    description: values.description?.trim() || "",
    start_at: new Date(values.start_at).toISOString(),
    end_at: new Date(values.end_at).toISOString(),
    all_day: values.all_day,
    visibility: values.visibility,
    branch_id: values.branch_id?.trim() || undefined,
  };

  if (event.type === "PROCEDURE" && values.event_type === "PROCEDURE") {
    return {
      ...base,
      procedure_id: values.procedure_id,
      patient_id: values.patient_id?.trim() || undefined,
      assistant_profile_ids: (values.assistant_profile_ids ?? []).filter(Boolean),
    };
  }
  return base;
}
