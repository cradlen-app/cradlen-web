import { apiAuthFetch } from "@/infrastructure/http/api";
import { mapApiVisitToScheduleEvent } from "./visits.utils";
import type {
  ApiPatientSearchResponse,
  ApiScheduleResponse,
  ApiVisit,
  ApiVisitListResponse,
  ApiVisitResponse,
  ApiVisitStatsResponse,
  ApiVisitStatus,
  BookMedicalRepVisitRequest,
  BookMedicalRepVisitResponse,
  BookVisitRequest,
  BookVisitResponse,
  UpdateVisitStatusRequest,
  VisitIntake,
} from "../types/visits.api.types";

export type PaginationParams = { page?: number; limit?: number };

export type UpdateVisitRequest = VisitIntake & {
  assigned_doctor_id?: string;
  branch_id?: string;
  appointment_type?: ApiVisit["visit_type"];
  priority?: ApiVisit["priority"];
  scheduled_at?: string;
  notes?: string;
  full_name?: string;
  national_id?: string;
  date_of_birth?: string;
  phone_number?: string;
  address?: string;
  marital_status?: "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED" | "SEPARATED" | "ENGAGED" | "UNKNOWN";
  husband_name?: string;
  spouse_full_name?: string;
  spouse_national_id?: string;
  spouse_phone_number?: string;
  spouse_guardian_id?: string;
};

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

export function fetchMyWaitingList({ page, limit }: PaginationParams = {}) {
  const search = new URLSearchParams();
  appendPagination(search, { page, limit });
  const qs = search.toString();
  return apiAuthFetch<ApiVisitListResponse>(
    `/visits/my-waiting-list${qs ? `?${qs}` : ""}`,
  );
}

export function fetchMyCurrentVisit() {
  return apiAuthFetch<{ data: ApiVisit | null }>(`/visits/my-current`);
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

export function startVisit({
  branchId,
  visitId,
}: {
  branchId: string;
  visitId: string;
}) {
  return apiAuthFetch<ApiVisitResponse>(
    `/branches/${branchId}/visits/${visitId}/start`,
    { method: "POST" },
  );
}

export function cancelVisit({
  branchId,
  visitId,
}: {
  branchId: string;
  visitId: string;
}) {
  return apiAuthFetch<ApiVisitResponse>(
    `/branches/${branchId}/visits/${visitId}/cancel`,
    { method: "POST" },
  );
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
