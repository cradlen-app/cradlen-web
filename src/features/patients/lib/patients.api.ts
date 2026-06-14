import { apiAuthFetch } from "@/infrastructure/http/api";
import type {
  ApiJourneyStatus,
  ApiJourneyType,
  ApiPatient,
  ApiPatientListResponse,
  ApiPatientStatsResponse,
} from "@/features/visits/types/visits.api.types";

export function fetchPatientById(id: string) {
  return apiAuthFetch<{ data: ApiPatient }>(`/patients/${id}`);
}

export type UpdatePatientRequest = {
  full_name?: string;
  date_of_birth?: string; // ISO date (yyyy-mm-dd)
  phone_number?: string;
  address?: string;
};

/** PATCH /patients/:id — edit global demographics (national_id is immutable). */
export function updatePatient(id: string, data: UpdatePatientRequest) {
  return apiAuthFetch<{ data: ApiPatient }>(`/patients/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

type FetchBranchPatientsParams = {
  search?: string;
  journey_status?: ApiJourneyStatus;
  journey_type?: ApiJourneyType;
  page?: number;
  limit?: number;
};

function patientListQuery(params: FetchBranchPatientsParams): string {
  const qs = new URLSearchParams();
  if (params.search)         qs.set("search", params.search);
  if (params.journey_status) qs.set("journey_status", params.journey_status);
  if (params.journey_type)   qs.set("journey_type", params.journey_type);
  if (params.page)           qs.set("page", String(params.page));
  if (params.limit)          qs.set("limit", String(params.limit));
  const q = qs.toString();
  return q ? `?${q}` : "";
}

export function fetchBranchPatients(
  branchId: string,
  params: FetchBranchPatientsParams = {},
) {
  return apiAuthFetch<ApiPatientListResponse>(
    `/branches/${branchId}/patients${patientListQuery(params)}`,
  );
}

/** OWNER-only org-wide directory — same row shape as the branch list. */
export function fetchOrgPatients(params: FetchBranchPatientsParams = {}) {
  return apiAuthFetch<ApiPatientListResponse>(
    `/patients/directory${patientListQuery(params)}`,
  );
}

/** Branch patient analytics: total + per-care-path counts with MoM trend. */
export function fetchBranchPatientStats(branchId: string, mine = false) {
  const qs = mine ? "?assigned_to_me=true" : "";
  return apiAuthFetch<ApiPatientStatsResponse>(
    `/branches/${branchId}/patients/stats${qs}`,
  );
}

/** OWNER-only org-wide patient analytics — same shape as the branch stats. */
export function fetchOrgPatientStats() {
  return apiAuthFetch<ApiPatientStatsResponse>(`/patients/stats`);
}
