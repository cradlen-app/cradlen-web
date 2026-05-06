import type {
  ApiScheduleEvent,
  ApiVisit,
  ApiVisitStats,
} from "../types/visits.api.types";
import type {
  ScheduleEvent,
  Visit,
  VisitStats,
  WaitingListFilter,
} from "../types/visits.types";

export function mapApiVisitToVisit(api: ApiVisit): Visit {
  const fullName = `${api.patient.first_name} ${api.patient.last_name}`.trim();
  return {
    id: api.id,
    branchId: api.branch_id,
    queueNumber: api.queue_number,
    patient: {
      id: api.patient.id,
      firstName: api.patient.first_name,
      lastName: api.patient.last_name,
      fullName,
      code: api.patient.code,
      phone: api.patient.phone,
      address: api.patient.address,
    },
    type: api.type,
    status: api.status,
    priority: api.priority,
    assignedDoctorId: api.assigned_doctor_id,
    assignedDoctorName: api.assigned_doctor_name,
    complaint: api.complaint,
    notes: api.notes,
    createdAt: api.created_at,
    scheduledAt: api.scheduled_at,
    startedAt: api.started_at,
    completedAt: api.completed_at,
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
    case "visit":
      return { type: "visit" };
    case "follow_up":
      return { type: "follow_up" };
    case "medical_rep":
      return { type: "medical_rep" };
    case "emergency":
      return { priority: "emergency" };
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
