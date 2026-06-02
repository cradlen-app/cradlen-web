import { apiAuthFetch } from "@/infrastructure/http/api";
import type { MedicalRepListResponse } from "../types/medical-rep.types";
import type { MedicalRepListParams } from "./medical-rep.queryKeys";
import type { ApiMedicalRepVisitListResponse } from "@/features/visits/types/visits.api.types";

export function fetchMedicalReps({ page, limit, search, status }: MedicalRepListParams) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search.trim()) params.set("search", search.trim());
  if (status) params.set("status", status);
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
