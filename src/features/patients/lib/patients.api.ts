import { apiAuthFetch } from "@/infrastructure/http/api";
import type {
  ApiJourneyStatus,
  ApiJourneyType,
  ApiPatientListResponse,
} from "@/features/visits/types/visits.api.types";

type FetchBranchPatientsParams = {
  search?: string;
  journey_status?: ApiJourneyStatus;
  journey_type?: ApiJourneyType;
  page?: number;
  limit?: number;
};

export function fetchBranchPatients(
  branchId: string,
  params: FetchBranchPatientsParams = {},
) {
  const qs = new URLSearchParams();
  if (params.search)         qs.set("search", params.search);
  if (params.journey_status) qs.set("journey_status", params.journey_status);
  if (params.journey_type)   qs.set("journey_type", params.journey_type);
  if (params.page)           qs.set("page", String(params.page));
  if (params.limit)          qs.set("limit", String(params.limit));
  const q = qs.toString();
  return apiAuthFetch<ApiPatientListResponse>(
    `/branches/${branchId}/patients${q ? `?${q}` : ""}`,
  );
}
