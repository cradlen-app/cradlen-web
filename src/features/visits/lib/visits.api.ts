import { apiAuthFetch } from "@/infrastructure/http/api";
import { mapApiVisitToScheduleEvent } from "./visits.utils";
import type {
  ApiPatientSearchResponse,
  ApiScheduleResponse,
  ApiVisit,
  ApiVitalsTrendPoint,
  ApiVisitHistoryResponse,
  ApiVisitListResponse,
  ApiVisitResponse,
  ApiVisitStatsResponse,
  ApiVisitStatus,
  BookMedicalRepVisitRequest,
  BookMedicalRepVisitResponse,
  BookVisitRequest,
  BookVisitResponse,
  UpdateVisitRequest,
  UpdateVisitStatusRequest,
} from "../types/visits.api.types";

export type PaginationParams = { page?: number; limit?: number };

export type { UpdateVisitRequest };

function appendPagination(search: URLSearchParams, params: PaginationParams) {
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
}

// ── reads ─────────────────────────────────────────────────────────────────────

export function fetchVisitStats({
  branchId,
  date,
  assignedToMe,
}: {
  branchId: string;
  date?: string;
  assignedToMe?: boolean;
}) {
  const params = new URLSearchParams();
  if (date) params.set("date", date);
  if (assignedToMe) params.set("assigned_to_me", "true");
  const qs = params.toString();
  return apiAuthFetch<ApiVisitStatsResponse>(
    `/branches/${branchId}/visits/stats${qs ? `?${qs}` : ""}`,
  );
}

export function fetchBranchWaitingList({
  branchId,
  page,
  limit,
}: { branchId: string } & PaginationParams) {
  const search = new URLSearchParams();
  appendPagination(search, { page, limit });
  const qs = search.toString();
  return apiAuthFetch<ApiVisitListResponse>(
    `/branches/${branchId}/visits/waiting-list${qs ? `?${qs}` : ""}`,
  );
}

export function fetchBranchInProgress({
  branchId,
  page,
  limit,
}: { branchId: string } & PaginationParams) {
  const search = new URLSearchParams();
  appendPagination(search, { page, limit });
  const qs = search.toString();
  return apiAuthFetch<ApiVisitListResponse>(
    `/branches/${branchId}/visits/in-progress${qs ? `?${qs}` : ""}`,
  );
}

export function fetchMyWaitingList({
  branchId,
  page,
  limit,
}: { branchId: string } & PaginationParams) {
  const search = new URLSearchParams();
  appendPagination(search, { page, limit });
  const qs = search.toString();
  return apiAuthFetch<ApiVisitListResponse>(
    `/branches/${branchId}/visits/my-waiting-list${qs ? `?${qs}` : ""}`,
  );
}

export function fetchMyCurrentVisit(branchId: string) {
  return apiAuthFetch<{ data: ApiVisit[] }>(
    `/branches/${branchId}/visits/my-current`,
  );
}

export function fetchVisit({ visitId }: { visitId: string }) {
  return apiAuthFetch<ApiVisitResponse>(`/visits/${visitId}`);
}

export function fetchTodaysSchedule({
  branchId,
  date,
}: {
  branchId: string;
  date?: string;
  assignedToMe?: boolean;
}): Promise<ApiScheduleResponse> {
  const search = new URLSearchParams({ status: "SCHEDULED" });
  if (date) {
    search.set("from", `${date}T00:00:00Z`);
    search.set("to", `${date}T23:59:59Z`);
  }
  return apiAuthFetch<ApiVisitListResponse>(
    `/branches/${branchId}/visits?${search.toString()}`,
  ).then((res) => ({ data: res.data.map(mapApiVisitToScheduleEvent) }));
}

export function searchPatients(search: string) {
  const params = new URLSearchParams({ search, limit: "20" });
  return apiAuthFetch<ApiPatientSearchResponse>(`/patients?${params.toString()}`);
}

export function fetchPatientVisitHistory({
  patientId,
  page = 1,
  limit = 3,
  excludeVisitId,
}: {
  patientId: string;
  page?: number;
  limit?: number;
  excludeVisitId?: string;
}) {
  const search = new URLSearchParams();
  search.set("page", String(page));
  search.set("limit", String(limit));
  if (excludeVisitId) search.set("exclude", excludeVisitId);
  return apiAuthFetch<ApiVisitHistoryResponse>(
    `/patients/${patientId}/visits/history?${search.toString()}`,
  );
}

export function fetchPatientVitalsTrend({
  patientId,
  excludeVisitId,
}: {
  patientId: string;
  excludeVisitId?: string;
}) {
  const search = new URLSearchParams();
  if (excludeVisitId) search.set("exclude", excludeVisitId);
  const qs = search.toString();
  return apiAuthFetch<{ data: ApiVitalsTrendPoint[] }>(
    `/patients/${patientId}/vitals-trend${qs ? `?${qs}` : ""}`,
  );
}

// ── writes ────────────────────────────────────────────────────────────────────

export function bookVisit(body: BookVisitRequest) {
  return apiAuthFetch<BookVisitResponse>("/visits/book", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function bookMedicalRepVisit(body: BookMedicalRepVisitRequest) {
  return apiAuthFetch<BookMedicalRepVisitResponse>("/medical-rep-visits/book", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// "Start visit" = the doctor begins the consultation. Reception has already
// moved the patient into the queue (IN_PROGRESS); this advances to
// IN_CONSULTATION, which the backend restricts to the assigned doctor.
export function startVisit({
  visitId,
}: {
  branchId?: string;
  visitId: string;
}) {
  return apiAuthFetch<ApiVisitResponse>(`/visits/${visitId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: "IN_CONSULTATION" } satisfies UpdateVisitStatusRequest),
  });
}

export function cancelVisit({
  visitId,
}: {
  branchId?: string;
  visitId: string;
}) {
  return apiAuthFetch<ApiVisitResponse>(`/visits/${visitId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: "CANCELLED" } satisfies UpdateVisitStatusRequest),
  });
}

export function updateVisitStatus({
  visitId,
  body,
}: {
  visitId: string;
  body: UpdateVisitStatusRequest;
}) {
  return apiAuthFetch<ApiVisitResponse>(`/visits/${visitId}/status`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function updateVisit({
  visitId,
  body,
}: {
  visitId: string;
  body: UpdateVisitRequest;
}) {
  return apiAuthFetch<ApiVisitResponse>(`/visits/${visitId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export type { ApiVisitStatus };
