import { apiAuthFetch } from "@/infrastructure/http/api";
import type { MedicalRepListResponse } from "../types/medical-rep.types";
import type { MedicalRepListParams } from "./medical-rep.queryKeys";

export function fetchMedicalReps({ page, limit, search, status }: MedicalRepListParams) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search.trim()) params.set("search", search.trim());
  if (status) params.set("status", status);
  return apiAuthFetch<MedicalRepListResponse>(`/medical-reps?${params}`);
}
