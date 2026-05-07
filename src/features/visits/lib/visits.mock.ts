// In-memory mock layer for the visits feature.
// Toggled by `NEXT_PUBLIC_VISITS_MOCK=true`. To remove when the real
// backend lands: delete this file, drop the import + ternaries in
// `visits.api.ts`, and remove the env flag from `.env.example`.

import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { VISIT_TYPE } from "./visits.constants";
import { ApiError } from "@/lib/api";
import type {
  ApiPaginationMeta,
  ApiPatient,
  ApiPatientSearchResponse,
  ApiScheduleEvent,
  ApiScheduleResponse,
  ApiVisit,
  ApiVisitListResponse,
  ApiVisitResponse,
  ApiVisitStats,
  ApiVisitStatsResponse,
  BookVisitNewPatientRequest,
  BookVisitRequest,
  BookVisitResponse,
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

const MOCK_DOCTOR = {
  id: "doctor-mock",
  specialty: "Gynecology",
  user: { id: "user-mock", first_name: "Ahmed", last_name: "Mohamed" },
};

const MOCK_DOCTOR_OTHER = {
  id: "doctor-other",
  specialty: "Gynecology",
  user: { id: "user-other", first_name: "Rania", last_name: "Ahmed" },
};

const mockPatients: ApiPatient[] = [
  {
    id: "p-1",
    full_name: "Asmaa Mohamed Ali",
    national_id: "28901010001",
    date_of_birth: "1989-01-01",
    phone_number: "01145047307",
    address: "Al Maraghah",
    is_married: true,
    husband_name: "Ahmed Ali",
    active_episodes: [],
  },
  {
    id: "p-2",
    full_name: "Manar Ahmed",
    national_id: "29503150002",
    date_of_birth: "1995-03-15",
    phone_number: "01148360307",
    address: "Bany Helal",
    is_married: false,
    active_episodes: [{ id: "ep-1", name: "First Trimester", order: 1 }],
  },
  {
    id: "p-3",
    full_name: "Fayza Mahmoud",
    national_id: "29210200003",
    date_of_birth: "1992-10-20",
    phone_number: "01148377905",
    address: "Hareedah",
    is_married: true,
    husband_name: "Mahmoud Hassan",
    active_episodes: [],
  },
];

function makeEpisode(patientId: string, fullName: string) {
  return {
    id: `ep-${patientId}`,
    journey: { patient: { id: patientId, full_name: fullName } },
  };
}

let visits: ApiVisit[] = [
  {
    id: "v-1",
    branch_id: "*",
    queue_number: 1,
    visit_type: "VISIT",
    status: "IN_PROGRESS",
    priority: "EMERGENCY",
    assigned_doctor: MOCK_DOCTOR,
    episode: makeEpisode("p-1", "Asmaa Mohamed Ali"),
    notes: "Severe abdominal pain",
    created_at: isoMinutesAgo(45),
    started_at: isoMinutesAgo(12),
  },
  {
    id: "v-2",
    branch_id: "*",
    queue_number: 2,
    visit_type: "FOLLOW_UP",
    status: "SCHEDULED",
    priority: "NORMAL",
    assigned_doctor: MOCK_DOCTOR,
    episode: makeEpisode("p-2", "Manar Ahmed"),
    created_at: isoMinutesAgo(30),
  },
  {
    id: "v-3",
    branch_id: "*",
    queue_number: 3,
    visit_type: "MEDICAL_REP",
    status: "SCHEDULED",
    priority: "NORMAL",
    episode: makeEpisode("p-3", "Fayza Mahmoud"),
    created_at: isoMinutesAgo(22),
  },
  {
    id: "v-4",
    branch_id: "*",
    queue_number: 4,
    visit_type: "VISIT",
    status: "CANCELLED",
    priority: "NORMAL",
    episode: makeEpisode("p-4", "Walaa Ali ElSayed"),
    created_at: isoMinutesAgo(120),
  },
  {
    id: "v-5",
    branch_id: "*",
    queue_number: 5,
    visit_type: "FOLLOW_UP",
    status: "CHECKED_IN",
    priority: "NORMAL",
    assigned_doctor: MOCK_DOCTOR_OTHER,
    episode: makeEpisode("p-5", "Safaa Gaber Ahmed"),
    created_at: isoMinutesAgo(15),
  },
  {
    id: "v-6",
    branch_id: "*",
    queue_number: 6,
    visit_type: "VISIT",
    status: "SCHEDULED",
    priority: "EMERGENCY",
    assigned_doctor: MOCK_DOCTOR,
    episode: makeEpisode("p-6", "Khayria Ahmed"),
    notes: "High fever",
    created_at: isoMinutesAgo(8),
  },
  {
    id: "v-7",
    branch_id: "*",
    queue_number: 7,
    visit_type: "VISIT",
    status: "COMPLETED",
    priority: "NORMAL",
    assigned_doctor: MOCK_DOCTOR,
    episode: makeEpisode("p-7", "Hany Saad"),
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
    ? visits.filter((v) => isMine(v.assigned_doctor?.id))
    : visits;
  const stats: ApiVisitStats = {
    total_visits: scope.length,
    visits: scope.filter((v) => v.visit_type === VISIT_TYPE.VISIT).length,
    follow_ups: scope.filter((v) => v.visit_type === VISIT_TYPE.FOLLOW_UP).length,
    medical_reps: scope.filter((v) => v.visit_type === VISIT_TYPE.MEDICAL_REP).length,
  };
  return delay({ data: stats });
}

export function fetchWaitingList({
  type,
  priority,
  status = "SCHEDULED,CHECKED_IN,IN_PROGRESS",
  assignedToMe,
  q,
  page = 1,
  limit = 10,
}: FetchWaitingListParams): Promise<ApiVisitListResponse> {
  const wantedStatuses = status.split(",").map((s) => s.trim()).filter(Boolean);

  let rows = visits.filter((v) => wantedStatuses.includes(v.status));
  if (type) rows = rows.filter((v) => v.visit_type === type);
  if (priority) rows = rows.filter((v) => v.priority === priority);
  if (assignedToMe) rows = rows.filter((v) => isMine(v.assigned_doctor?.id));
  if (q) {
    const needle = q.toLowerCase();
    rows = rows.filter((v) =>
      (v.episode?.journey?.patient?.full_name ?? "").toLowerCase().includes(needle),
    );
  }

  rows = rows.sort((a, b) => (a.queue_number ?? 0) - (b.queue_number ?? 0));

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const slice = rows.slice(start, start + limit);

  const meta: ApiPaginationMeta = { page, limit, total, total_pages: totalPages };
  return delay({ data: slice, meta });
}

export function fetchCurrentVisit({
  assignedToMe,
}: {
  branchId: string;
  assignedToMe?: boolean;
}): Promise<ApiVisitListResponse> {
  const candidate = visits.find(
    (v) =>
      v.status === "IN_PROGRESS" &&
      (!assignedToMe || isMine(v.assigned_doctor?.id)),
  );
  const data = candidate ? [candidate] : [];
  const meta: ApiPaginationMeta = { page: 1, limit: 1, total: data.length, total_pages: data.length > 0 ? 1 : 0 };
  return delay({ data, meta });
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
        (e) => !e.doctor_ids?.length || e.doctor_ids.some((id) => isMine(id)),
      )
    : scheduleEvents;
  return delay({ data });
}

export function searchPatients(
  search: string,
): Promise<ApiPatientSearchResponse> {
  const needle = search.toLowerCase();
  const matched = mockPatients.filter(
    (p) =>
      p.full_name.toLowerCase().includes(needle) ||
      (p.national_id ?? "").includes(needle) ||
      (p.phone_number ?? "").includes(needle),
  );
  const meta: ApiPaginationMeta = {
    page: 1,
    limit: 20,
    total: matched.length,
    total_pages: 1,
  };
  return delay({ data: matched, meta });
}

// ── writes ────────────────────────────────────────────────────────────────────

export function bookVisit(body: BookVisitRequest): Promise<BookVisitResponse> {
  const newQueueNumber =
    Math.max(0, ...visits.map((v) => v.queue_number ?? 0)) + 1;

  let patientRecord: ApiPatient;

  if ("patient_id" in body && body.patient_id) {
    const existing = mockPatients.find((p) => p.id === body.patient_id);
    if (!existing) fail(404, "Patient not found");
    patientRecord = existing;
  } else {
    const np = body as BookVisitNewPatientRequest;
    if (np.national_id && mockPatients.find((p) => p.national_id === np.national_id)) {
      fail(409, "national_id already exists");
    }
    patientRecord = {
      id: `p-${nextPatientId++}`,
      full_name: np.full_name,
      national_id: np.national_id,
      date_of_birth: np.date_of_birth,
      phone_number: np.phone_number,
      address: np.address,
      is_married: np.is_married,
      husband_name: np.husband_name,
      active_episodes: [],
    };
    mockPatients.push(patientRecord);
  }

  const visit: ApiVisit = {
    id: `v-${nextVisitId++}`,
    branch_id: body.branch_id ?? "*",
    queue_number: newQueueNumber,
    visit_type: body.visit_type,
    status: "SCHEDULED",
    priority: body.priority,
    assigned_doctor: body.assigned_doctor_id ? {
      id: body.assigned_doctor_id,
      user: { id: body.assigned_doctor_id, first_name: "Dr.", last_name: "Doctor" },
    } : undefined,
    episode: makeEpisode(patientRecord.id, patientRecord.full_name),
    notes: body.notes,
    created_at: new Date().toISOString(),
    scheduled_at: body.scheduled_at,
  };

  visits = [...visits, visit];
  return delay({
    data: {
      visit,
      patient: patientRecord,
      episode: null,
      journey: null,
    },
  });
}

export function startVisit({
  visitId,
}: {
  branchId: string;
  visitId: string;
}): Promise<ApiVisitResponse> {
  const visit = findVisit(visitId);
  if (visit.status !== "CHECKED_IN" && visit.status !== "SCHEDULED") {
    fail(409, "Visit cannot be started in its current state");
  }
  visit.status = "IN_PROGRESS";
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
  visit.status = "CANCELLED";
  return delay({ data: visit });
}

export function updateVisitStatus({
  visitId,
  body,
}: {
  visitId: string;
  body: UpdateVisitStatusRequest;
}): Promise<ApiVisitResponse> {
  const visit = findVisit(visitId);
  visit.status = body.status;
  if (body.status === "IN_PROGRESS" && !visit.started_at) {
    visit.started_at = new Date().toISOString();
  }
  if (body.status === "COMPLETED" && !visit.completed_at) {
    visit.completed_at = new Date().toISOString();
  }
  return delay({ data: visit });
}
