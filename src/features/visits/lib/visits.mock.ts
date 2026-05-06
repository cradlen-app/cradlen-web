// In-memory mock layer for the visits feature.
// Toggled by `NEXT_PUBLIC_VISITS_MOCK=true`. To remove when the real
// backend lands: delete this file, drop the import + ternaries in
// `visits.api.ts`, and remove the env flag from `.env.example`.

import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { ApiError } from "@/lib/api";
import type {
  ApiCurrentVisitResponse,
  ApiPaginationMeta,
  ApiScheduleEvent,
  ApiScheduleResponse,
  ApiVisit,
  ApiVisitListResponse,
  ApiVisitResponse,
  ApiVisitStats,
  ApiVisitStatsResponse,
  CreateVisitRequest,
  UpdateVisitStatusRequest,
} from "../types/visits.api.types";

// ── seed data ─────────────────────────────────────────────────────────────────

let nextVisitId = 100;
let nextPatientId = 200;

const NOW = new Date();

function isoMinutesAgo(minutes: number) {
  return new Date(NOW.getTime() - minutes * 60_000).toISOString();
}

function todayAt(hours: number, minutes = 0) {
  const d = new Date(NOW);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

let visits: ApiVisit[] = [
  {
    id: "v-1",
    branch_id: "*",
    queue_number: 1,
    patient: {
      id: "p-1",
      first_name: "Asmaa",
      last_name: "Mohamed Ali",
      code: "P-0001",
      phone: "01145047307",
      address: "Al Maraghah",
    },
    type: "visit",
    status: "in_progress",
    priority: "emergency",
    assigned_doctor_id: "doctor-mock",
    assigned_doctor_name: "Dr. Ahmed Mohamed",
    complaint: "Severe abdominal pain",
    created_at: isoMinutesAgo(45),
    started_at: isoMinutesAgo(12),
  },
  {
    id: "v-2",
    branch_id: "*",
    queue_number: 2,
    patient: {
      id: "p-2",
      first_name: "Manar",
      last_name: "Ahmed",
      code: "P-0002",
      phone: "01148360307",
      address: "Bany Helal",
    },
    type: "follow_up",
    status: "waiting",
    priority: "normal",
    assigned_doctor_id: "doctor-mock",
    assigned_doctor_name: "Dr. Ahmed Mohamed",
    created_at: isoMinutesAgo(30),
  },
  {
    id: "v-3",
    branch_id: "*",
    queue_number: 3,
    patient: {
      id: "p-3",
      first_name: "Fayza",
      last_name: "Mahmoud",
      code: "P-0003",
      phone: "01148377905",
      address: "Hareedah",
    },
    type: "medical_rep",
    status: "waiting",
    priority: "normal",
    created_at: isoMinutesAgo(22),
  },
  {
    id: "v-4",
    branch_id: "*",
    queue_number: 4,
    patient: {
      id: "p-4",
      first_name: "Walaa",
      last_name: "Ali ElSayed",
      code: "P-0004",
      phone: "01548377307",
      address: "Nag El-Maaskar",
    },
    type: "visit",
    status: "cancelled",
    priority: "normal",
    created_at: isoMinutesAgo(120),
  },
  {
    id: "v-5",
    branch_id: "*",
    queue_number: 5,
    patient: {
      id: "p-5",
      first_name: "Safaa",
      last_name: "Gaber Ahmed",
      code: "P-0005",
      phone: "01148677307",
      address: "Al Maraghah",
    },
    type: "follow_up",
    status: "waiting",
    priority: "normal",
    assigned_doctor_id: "doctor-other",
    assigned_doctor_name: "Dr. Rania Ahmed",
    created_at: isoMinutesAgo(15),
  },
  {
    id: "v-6",
    branch_id: "*",
    queue_number: 6,
    patient: {
      id: "p-6",
      first_name: "Khayria",
      last_name: "Ahmed",
      code: "P-0006",
      phone: "01148357307",
      address: "Al Maraghah",
    },
    type: "visit",
    status: "waiting",
    priority: "emergency",
    assigned_doctor_id: "doctor-mock",
    assigned_doctor_name: "Dr. Ahmed Mohamed",
    complaint: "High fever",
    created_at: isoMinutesAgo(8),
  },
  {
    id: "v-7",
    branch_id: "*",
    queue_number: 7,
    patient: {
      id: "p-7",
      first_name: "Hany",
      last_name: "Saad",
      code: "P-0007",
      phone: "01045009922",
    },
    type: "visit",
    status: "completed",
    priority: "normal",
    assigned_doctor_id: "doctor-mock",
    assigned_doctor_name: "Dr. Ahmed Mohamed",
    created_at: isoMinutesAgo(180),
    started_at: isoMinutesAgo(170),
    completed_at: isoMinutesAgo(140),
  },
];

const scheduleEvents: ApiScheduleEvent[] = [
  {
    id: "s-1",
    branch_id: "*",
    title: "Meeting with Ibrahem Abodeif",
    kind: "meeting",
    start_time: todayAt(8, 0),
    end_time: todayAt(10, 0),
  },
  {
    id: "s-2",
    branch_id: "*",
    title: "Private Visit",
    kind: "appointment",
    start_time: todayAt(11, 0),
    end_time: todayAt(12, 0),
    patient_name: "Hesham Ali",
    doctor_ids: ["doctor-mock"],
    doctor_names: ["Dr. Ahmed Mohamed"],
  },
  {
    id: "s-3",
    branch_id: "*",
    title: "Cesarean surgery",
    kind: "visit",
    start_time: todayAt(14, 0),
    end_time: todayAt(15, 30),
    patient_name: "Rahma Abdelali",
    doctor_ids: ["doctor-mock", "doctor-other"],
    doctor_names: ["Dr. Ahmed Mohamed", "Dr. Rania Ahmed"],
    notes: "Pre-op prep at 13:30",
  },
];

// ── helpers ───────────────────────────────────────────────────────────────────

const LATENCY_MIN = 180;
const LATENCY_MAX = 380;

function delay<T>(value: T): Promise<T> {
  const ms = LATENCY_MIN + Math.floor(Math.random() * (LATENCY_MAX - LATENCY_MIN));
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function fail(status: number, message: string): never {
  throw new ApiError(status, message);
}

// In mock mode the seeded "assigned_doctor_id" is the sentinel "doctor-mock".
// We treat that as the current user so `assignedToMe` returns sensible
// results regardless of the real profile id stored in the auth context.
const MOCK_DOCTOR_ID = "doctor-mock";

function getCurrentProfileId() {
  return useAuthContextStore.getState().profileId ?? MOCK_DOCTOR_ID;
}

function isMine(assignedDoctorId: string | undefined) {
  if (!assignedDoctorId) return false;
  if (assignedDoctorId === MOCK_DOCTOR_ID) return true;
  return assignedDoctorId === getCurrentProfileId();
}

function findVisit(visitId: string) {
  const visit = visits.find((v) => v.id === visitId);
  if (!visit) fail(404, "Visit not found");
  return visit;
}

// ── parameter type ────────────────────────────────────────────────────────────

export type FetchWaitingListParams = {
  branchId: string;
  type?: string;
  priority?: string;
  status?: string;
  assignedToMe?: boolean;
  q?: string;
  page?: number;
  limit?: number;
};

// ── reads ─────────────────────────────────────────────────────────────────────

export function fetchVisitStats({
  assignedToMe,
}: {
  branchId: string;
  date?: string;
  assignedToMe?: boolean;
}): Promise<ApiVisitStatsResponse> {
  const scope = assignedToMe
    ? visits.filter((v) => isMine(v.assigned_doctor_id))
    : visits;
  const stats: ApiVisitStats = {
    total_visits: scope.length,
    visits: scope.filter((v) => v.type === "visit").length,
    follow_ups: scope.filter((v) => v.type === "follow_up").length,
    medical_reps: scope.filter((v) => v.type === "medical_rep").length,
  };
  return delay({ data: stats });
}

export function fetchWaitingList({
  type,
  priority,
  status = "waiting,pending",
  assignedToMe,
  q,
  page = 1,
  limit = 10,
}: FetchWaitingListParams): Promise<ApiVisitListResponse> {
  const wantedStatuses = status.split(",").map((s) => s.trim()).filter(Boolean);

  let rows = visits.filter((v) => wantedStatuses.includes(v.status));
  if (type) rows = rows.filter((v) => v.type === type);
  if (priority) rows = rows.filter((v) => v.priority === priority);
  if (assignedToMe) rows = rows.filter((v) => isMine(v.assigned_doctor_id));
  if (q) {
    const needle = q.toLowerCase();
    rows = rows.filter((v) =>
      `${v.patient.first_name} ${v.patient.last_name} ${v.patient.code ?? ""}`
        .toLowerCase()
        .includes(needle),
    );
  }

  rows = rows.sort((a, b) => (a.queue_number ?? 0) - (b.queue_number ?? 0));

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const slice = rows.slice(start, start + limit);

  const meta: ApiPaginationMeta = {
    page,
    limit,
    total,
    total_pages: totalPages,
  };

  return delay({ data: slice, meta });
}

export function fetchCurrentVisit({
  assignedToMe,
}: {
  branchId: string;
  assignedToMe?: boolean;
}): Promise<ApiCurrentVisitResponse> {
  const candidate = visits.find(
    (v) =>
      v.status === "in_progress" &&
      (!assignedToMe || isMine(v.assigned_doctor_id)),
  );
  return delay({ data: candidate ?? null });
}

export function fetchTodaysSchedule({
  assignedToMe,
}: {
  branchId: string;
  date?: string;
  assignedToMe?: boolean;
}): Promise<ApiScheduleResponse> {
  const data = assignedToMe
    ? scheduleEvents.filter(
        (e) =>
          !e.doctor_ids?.length || e.doctor_ids.some((id) => isMine(id)),
      )
    : scheduleEvents;
  return delay({ data });
}

// ── writes ────────────────────────────────────────────────────────────────────

export function createVisit({
  branchId,
  body,
}: {
  branchId: string;
  body: CreateVisitRequest;
}): Promise<ApiVisitResponse> {
  const newQueueNumber =
    Math.max(0, ...visits.map((v) => v.queue_number ?? 0)) + 1;
  const patient =
    body.patient_id && !body.new_patient
      ? visits.find((v) => v.patient.id === body.patient_id)?.patient ?? {
          id: body.patient_id,
          first_name: "Unknown",
          last_name: "Patient",
        }
      : {
          id: `p-${nextPatientId++}`,
          first_name: body.new_patient!.first_name,
          last_name: body.new_patient!.last_name,
          phone: body.new_patient!.phone,
          code: body.new_patient!.code,
        };

  const visit: ApiVisit = {
    id: `v-${nextVisitId++}`,
    branch_id: branchId,
    queue_number: newQueueNumber,
    patient,
    type: body.type,
    status: "waiting",
    priority: body.priority,
    assigned_doctor_id: body.assigned_doctor_id,
    assigned_doctor_name: body.assigned_doctor_id
      ? "Dr. Ahmed Mohamed"
      : undefined,
    complaint: body.complaint,
    created_at: new Date().toISOString(),
    scheduled_at: body.scheduled_at,
  };

  visits = [...visits, visit];
  return delay({ data: visit });
}

export function startVisit({
  visitId,
}: {
  branchId: string;
  visitId: string;
}): Promise<ApiVisitResponse> {
  const visit = findVisit(visitId);
  if (visit.status !== "waiting" && visit.status !== "pending") {
    fail(409, "Visit cannot be started in its current state");
  }
  visit.status = "in_progress";
  visit.started_at = new Date().toISOString();
  return delay({ data: visit });
}

export function cancelVisit({
  visitId,
}: {
  branchId: string;
  visitId: string;
}): Promise<ApiVisitResponse> {
  const visit = findVisit(visitId);
  visit.status = "cancelled";
  return delay({ data: visit });
}

export function updateVisitStatus({
  visitId,
  body,
}: {
  branchId: string;
  visitId: string;
  body: UpdateVisitStatusRequest;
}): Promise<ApiVisitResponse> {
  const visit = findVisit(visitId);
  visit.status = body.status;
  if (body.status === "in_progress" && !visit.started_at) {
    visit.started_at = new Date().toISOString();
  }
  if (body.status === "completed" && !visit.completed_at) {
    visit.completed_at = new Date().toISOString();
  }
  return delay({ data: visit });
}
