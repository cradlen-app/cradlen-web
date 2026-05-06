import { apiAuthFetch } from "@/lib/api";
import type {
  ApiPatientSearchResponse,
  ApiScheduleResponse,
  ApiVisitListResponse,
  ApiVisitResponse,
  ApiVisitStatsResponse,
  ApiVisitStatus,
  BookVisitRequest,
  BookVisitResponse,
  UpdateVisitStatusRequest,
} from "../types/visits.api.types";
import type { FetchWaitingListParams } from "./visits.mock";
import * as mock from "./visits.mock";

const useMock = process.env.NEXT_PUBLIC_VISITS_MOCK === "true";

// ── reads ─────────────────────────────────────────────────────────────────────

function realFetchVisitStats({
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

function realFetchWaitingList(params: FetchWaitingListParams) {
  const search = new URLSearchParams();
  if (params.type) search.set("type", params.type);
  if (params.priority) search.set("priority", params.priority);
  if (params.status) search.set("status", params.status);
  if (params.assignedToMe) search.set("assigned_to_me", "true");
  if (params.q) search.set("q", params.q);
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  return apiAuthFetch<ApiVisitListResponse>(
    `/branches/${params.branchId}/visits?${search.toString()}`,
  );
}

function realFetchCurrentVisit({
  branchId,
  assignedToMe,
}: {
  branchId: string;
  assignedToMe?: boolean;
}) {
  const search = new URLSearchParams({ status: "IN_PROGRESS", limit: "1" });
  if (assignedToMe) search.set("assigned_to_me", "true");
  return apiAuthFetch<ApiVisitListResponse>(
    `/branches/${branchId}/visits?${search.toString()}`,
  );
}

async function realFetchTodaysSchedule({
  branchId,
  date,
  assignedToMe,
}: {
  branchId: string;
  date?: string;
  assignedToMe?: boolean;
}): Promise<ApiScheduleResponse> {
  try {
    const search = new URLSearchParams();
    if (date) search.set("date", date);
    if (assignedToMe) search.set("assigned_to_me", "true");
    const qs = search.toString();
    return await apiAuthFetch<ApiScheduleResponse>(
      `/branches/${branchId}/schedule${qs ? `?${qs}` : ""}`,
    );
  } catch {
    return { data: [] };
  }
}

function realSearchPatients(search: string) {
  const params = new URLSearchParams({ search, limit: "20" });
  return apiAuthFetch<ApiPatientSearchResponse>(`/patients?${params.toString()}`);
}

// ── writes ────────────────────────────────────────────────────────────────────

function realBookVisit(body: BookVisitRequest) {
  return apiAuthFetch<BookVisitResponse>("/visits/book", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

function realStartVisit({
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

function realCancelVisit({
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

function realUpdateVisitStatus({
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

// ── public surface (single switch on env flag) ────────────────────────────────

export const fetchVisitStats = useMock ? mock.fetchVisitStats : realFetchVisitStats;
export const fetchWaitingList = useMock ? mock.fetchWaitingList : realFetchWaitingList;
export const fetchCurrentVisit = useMock ? mock.fetchCurrentVisit : realFetchCurrentVisit;
export const fetchTodaysSchedule = useMock ? mock.fetchTodaysSchedule : realFetchTodaysSchedule;
export const searchPatients = useMock ? mock.searchPatients : realSearchPatients;
export const bookVisit = useMock ? mock.bookVisit : realBookVisit;
export const startVisit = useMock ? mock.startVisit : realStartVisit;
export const cancelVisit = useMock ? mock.cancelVisit : realCancelVisit;
export const updateVisitStatus = useMock ? mock.updateVisitStatus : realUpdateVisitStatus;

export type { ApiVisitStatus };
