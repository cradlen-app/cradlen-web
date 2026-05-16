import { VISIT_PRIORITY, VISIT_TYPE } from "./visits.constants";
import type {
  ApiMedicalRep,
  ApiPatient,
  ApiPatientListItem,
  ApiScheduleEvent,
  ApiScheduleEventKind,
  ApiVisit,
  ApiVisitStats,
  ApiVisitType,
} from "../types/visits.api.types";
import type {
  Patient,
  ScheduleEvent,
  Visit,
  VisitStats,
  WaitingListFilter,
} from "../types/visits.types";

type ApiMedRepVisitForMapping = {
  id: string;
  branch_id: string;
  medical_rep_id: string;
  assigned_doctor_id: string;
  scheduled_at: string;
  status: string;
  priority: string;
  notes?: string | null;
  queue_number?: number | null;
  checked_in_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at?: string;
  medical_rep?: ApiMedicalRep | null;
  assigned_doctor?: {
    id: string;
    user: { id: string; first_name: string; last_name: string };
  };
};

export function mapApiMedRepVisitToVisit(api: ApiMedRepVisitForMapping): Visit {
  const rep = api.medical_rep;
  const doctorUser = api.assigned_doctor?.user;
  const displayName = rep
    ? rep.company_name
      ? `${rep.full_name} · ${rep.company_name}`
      : rep.full_name
    : "Medical rep";
  return {
    id: api.id,
    kind: "medical_rep",
    branchId: api.branch_id,
    queueNumber: api.queue_number ?? undefined,
    patient: {
      id: rep?.id ?? api.medical_rep_id,
      firstName: "",
      lastName: "",
      fullName: rep?.full_name ?? displayName,
      nationalId: rep?.national_id ?? undefined,
      phone: rep?.phone_number ?? undefined,
      email: rep?.email ?? undefined,
      companyName: rep?.company_name ?? undefined,
    },
    type: "MEDICAL_REP",
    status: api.status as Visit["status"],
    priority: api.priority as Visit["priority"],
    assignedDoctorId: api.assigned_doctor?.id ?? api.assigned_doctor_id,
    assignedDoctorName: doctorUser
      ? `${doctorUser.first_name} ${doctorUser.last_name}`.trim()
      : undefined,
    notes: api.notes ?? undefined,
    chiefComplaint: null,
    chiefComplaintMeta: null,
    vitals: null,
    createdAt: api.created_at ?? "",
    scheduledAt: api.scheduled_at,
    startedAt: api.started_at ?? undefined,
    completedAt: api.completed_at ?? undefined,
  };
}

export function mapApiVisitToVisit(api: ApiVisit): Visit {
  const patient = api.episode?.journey?.patient;
  const doctorUser = api.assigned_doctor?.user;
  return {
    id: api.id,
    kind: "patient",
    branchId: api.branch_id ?? "",
    queueNumber: api.queue_number,
    patient: {
      id: patient?.id ?? "",
      firstName: "",
      lastName: "",
      fullName: patient?.full_name ?? "",
      phone: undefined,
      address: undefined,
    },
    type: api.appointment_type,
    status: api.status,
    priority: api.priority,
    assignedDoctorId: api.assigned_doctor?.id,
    assignedDoctorName: doctorUser
      ? `${doctorUser.first_name} ${doctorUser.last_name}`.trim()
      : undefined,
    carePathCode: api.episode?.journey?.care_path?.code ?? undefined,
    notes: api.notes,
    chiefComplaint: api.chief_complaint ?? null,
    chiefComplaintMeta: api.chief_complaint_meta ?? null,
    vitals: api.vitals ?? null,
    createdAt: api.created_at ?? "",
    scheduledAt: api.scheduled_at,
    startedAt: api.started_at,
    completedAt: api.completed_at,
  };
}

/**
 * Strip undefined / empty-string / NaN values from an object, recursively.
 * Returns undefined if the result is an empty object so callers can omit the key entirely.
 */
export function pruneEmpty<T extends Record<string, unknown>>(input: T): T | undefined {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    if (typeof value === "number" && Number.isNaN(value)) continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      out[key] = value;
      continue;
    }
    if (typeof value === "object") {
      const nested = pruneEmpty(value as Record<string, unknown>);
      if (nested) out[key] = nested;
      continue;
    }
    out[key] = value;
  }
  return Object.keys(out).length > 0 ? (out as T) : undefined;
}

export function mapApiPatientToPatient(api: ApiPatient): Patient {
  return {
    id: api.id,
    fullName: api.full_name,
    nationalId: api.national_id,
    dateOfBirth: api.date_of_birth?.slice(0, 10),
    phoneNumber: api.phone_number,
    address: api.address,
    maritalStatus: api.marital_status,
    activeEpisodes: api.active_episodes,
    lastVisitDate: api.last_visit_date?.slice(0, 10),
    nextVisitDate: api.next_visit_date?.slice(0, 10),
    activeJourneyName: api.active_journey_name,
    journeyStatus: api.journey_status,
  };
}

export function mapApiPatientListItemToPatient(api: ApiPatientListItem): Patient {
  return {
    id: api.id,
    fullName: api.full_name,
    nationalId: api.national_id,
    dateOfBirth: api.date_of_birth?.slice(0, 10),
    phoneNumber: api.phone_number,
    address: api.address,
    lastVisitDate: api.last_visit_date?.slice(0, 10) ?? undefined,
    journeyId: api.journey?.id,
    journeyType: api.journey?.type,
    journeyStatus: api.journey?.status,
  };
}

export function mapApiStatsToStats(api: ApiVisitStats): VisitStats {
  return {
    totalVisits: api.total_visits,
    visits: api.visits,
    followUps: api.follow_ups,
    medicalReps: api.medical_reps,
  };
}

const VISIT_KIND_MAP: Record<ApiVisitType, ApiScheduleEventKind> = {
  VISIT: "visit",
  FOLLOW_UP: "appointment",
  MEDICAL_REP: "meeting",
};

export function mapApiVisitToScheduleEvent(api: ApiVisit): ApiScheduleEvent {
  const startTime = api.scheduled_at ?? api.created_at ?? new Date().toISOString();
  const endTime = new Date(new Date(startTime).getTime() + 30 * 60_000).toISOString();
  const doctorUser = api.assigned_doctor?.user;
  return {
    id: api.id,
    branch_id: api.branch_id ?? "",
    title: api.episode?.journey?.patient?.full_name ?? api.appointment_type,
    kind: VISIT_KIND_MAP[api.appointment_type] ?? "visit",
    patient_name: api.episode?.journey?.patient?.full_name,
    doctor_ids: api.assigned_doctor?.id ? [api.assigned_doctor.id] : undefined,
    doctor_names: doctorUser
      ? [`${doctorUser.first_name} ${doctorUser.last_name}`.trim()]
      : undefined,
    start_time: startTime,
    end_time: endTime,
    notes: api.notes,
  };
}

export function mapApiScheduleEvent(api: ApiScheduleEvent): ScheduleEvent {
  return {
    id: api.id,
    branchId: api.branch_id,
    title: api.title,
    kind: api.kind,
    patientName: api.patient_name,
    doctorIds: api.doctor_ids,
    doctorNames: api.doctor_names,
    startTime: api.start_time,
    endTime: api.end_time,
    notes: api.notes,
  };
}

export function buildWaitingListQuery(filter: WaitingListFilter): {
  type?: string;
  priority?: string;
} {
  switch (filter) {
    case VISIT_TYPE.VISIT:
      return { type: VISIT_TYPE.VISIT };
    case VISIT_TYPE.FOLLOW_UP:
      return { type: VISIT_TYPE.FOLLOW_UP };
    case VISIT_TYPE.MEDICAL_REP:
      return { type: VISIT_TYPE.MEDICAL_REP };
    case VISIT_PRIORITY.EMERGENCY:
      return { priority: VISIT_PRIORITY.EMERGENCY };
    default:
      return {};
  }
}

const TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export function formatClockTime(iso?: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return TIME_FORMATTER.format(date);
}

export function formatTimeRange(startIso: string, endIso: string) {
  return `${formatClockTime(startIso)} - ${formatClockTime(endIso)}`;
}

export function formatWaitTime(createdAtIso: string, now = new Date()) {
  const created = new Date(createdAtIso);
  if (Number.isNaN(created.getTime())) return "";
  const diffMs = now.getTime() - created.getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60_000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return remMinutes ? `${hours}h ${remMinutes}m` : `${hours}h`;
}

export function getTodayIso(now = new Date()) {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
