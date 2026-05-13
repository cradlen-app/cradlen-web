import { apiAuthFetch } from "@/infrastructure/http/api";
import type {
  ApiMedicalRepVisitListResponse,
  ApiMedicalRepVisitMaybeResponse,
  ApiMedicalRepVisitResponse,
  UpdateMedicalRepVisitRequest,
  UpdateMedicalRepVisitStatusRequest,
} from "../types/visits.api.types";

type PaginationParams = { page?: number; limit?: number };

function withPagination(params: PaginationParams) {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function fetchMedRepBranchWaitingList({
  branchId,
  page,
  limit,
}: { branchId: string } & PaginationParams) {
  return apiAuthFetch<ApiMedicalRepVisitListResponse>(
    `/branches/${branchId}/medical-rep-visits/waiting-list${withPagination({ page, limit })}`,
  );
}

export function fetchMedRepBranchInProgress({
  branchId,
  page,
  limit,
}: { branchId: string } & PaginationParams) {
  return apiAuthFetch<ApiMedicalRepVisitListResponse>(
    `/branches/${branchId}/medical-rep-visits/in-progress${withPagination({ page, limit })}`,
  );
}

export function fetchMedRepMyWaitingList(params: PaginationParams = {}) {
  return apiAuthFetch<ApiMedicalRepVisitListResponse>(
    `/medical-rep-visits/my-waiting-list${withPagination(params)}`,
  );
}

export function fetchMedRepMyCurrent() {
  return apiAuthFetch<ApiMedicalRepVisitMaybeResponse>(
    `/medical-rep-visits/my-current`,
  );
}

export function fetchMedRepVisit({ visitId }: { visitId: string }) {
  return apiAuthFetch<ApiMedicalRepVisitResponse>(
    `/medical-rep-visits/${visitId}`,
  );
}

export function updateMedRepVisit({
  visitId,
  body,
}: {
  visitId: string;
  body: UpdateMedicalRepVisitRequest;
}) {
  return apiAuthFetch<ApiMedicalRepVisitResponse>(
    `/medical-rep-visits/${visitId}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
}

export function updateMedRepVisitStatus({
  visitId,
  body,
}: {
  visitId: string;
  body: UpdateMedicalRepVisitStatusRequest;
}) {
  return apiAuthFetch<ApiMedicalRepVisitResponse>(
    `/medical-rep-visits/${visitId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
}
