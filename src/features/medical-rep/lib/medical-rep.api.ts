import { apiAuthFetch } from "@/infrastructure/http/api";
import type {
  MedicalRepListResponse,
  MedicalRepVisitHistoryResponse,
} from "../types/medical-rep.types";
import type { MedicalRepListParams } from "./medical-rep.queryKeys";
import type { ApiMedicalRepVisitListResponse } from "@/features/visits/types/visits.api.types";

export function fetchMedicalReps({ page, limit, search }: MedicalRepListParams) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search.trim()) params.set("search", search.trim());
  return apiAuthFetch<MedicalRepListResponse>(`/medical-reps?${params}`);
}

/** A single rep's visits, most recent first — backs the drawer "Visits" list. */
export function fetchMedicalRepVisits(repId: string, limit = 20) {
  const params = new URLSearchParams({
    medical_rep_id: repId,
    limit: String(limit),
  });
  return apiAuthFetch<ApiMedicalRepVisitListResponse>(
    `/medical-rep-visits?${params}`,
  );
}

/** Past COMPLETED visits for the rep of `visitId` — backs the Overview timeline. */
export function fetchMedicalRepVisitHistory({
  visitId,
  page,
  limit,
}: {
  visitId: string;
  page: number;
  limit: number;
}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  return apiAuthFetch<MedicalRepVisitHistoryResponse>(
    `/medical-rep-visits/${visitId}/history?${params}`,
  );
}
