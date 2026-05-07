import { VISIT_PRIORITY, VISIT_TYPE } from "./visits.constants";
import type {
  ApiPatient,
  ApiPatientListItem,
  ApiScheduleEvent,
  ApiVisit,
  ApiVisitStats,
} from "../types/visits.api.types";
import type {
  Patient,
  ScheduleEvent,
  Visit,
  VisitStats,
  WaitingListFilter,
} from "../types/visits.types";

export function mapApiVisitToVisit(api: ApiVisit): Visit {
  const patient = api.episode?.journey?.patient;
  const doctorUser = api.assigned_doctor?.user;
  return {
    id: api.id,
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
    type: api.visit_type,
    status: api.status,
    priority: api.priority,
    assignedDoctorId: api.assigned_doctor?.id,
    assignedDoctorName: doctorUser
      ? `${doctorUser.first_name} ${doctorUser.last_name}`.trim()
      : undefined,
    notes: api.notes,
    createdAt: api.created_at ?? "",
    scheduledAt: api.scheduled_at,
    startedAt: api.started_at,
    completedAt: api.completed_at,
  };
}

export function mapApiPatientToPatient(api: ApiPatient): Patient {
  return {
    id: api.id,
    fullName: api.full_name,
    nationalId: api.national_id,
    dateOfBirth: api.date_of_birth?.slice(0, 10),
    phoneNumber: api.phone_number,
    address: api.address,
    isMarried: api.is_married,
    husbandName: api.husband_name,
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
