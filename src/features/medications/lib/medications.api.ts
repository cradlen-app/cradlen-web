import { apiAuthFetch } from "@/infrastructure/http/api";
import type {
  Medication,
  MedicationListResponse,
  CreateMedicationRequest,
  UpdateMedicationRequest,
} from "../types/medications.types";
import type { MedicationListParams } from "./medications.queryKeys";

export function fetchMedications({ page, limit, search }: MedicationListParams) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search.trim()) params.set("search", search.trim());
  return apiAuthFetch<MedicationListResponse>(`/medications?${params}`);
}

export function createMedication(data: CreateMedicationRequest) {
  return apiAuthFetch<Medication>("/medications", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateMedication(id: string, data: UpdateMedicationRequest) {
  return apiAuthFetch<Medication>(`/medications/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteMedication(id: string) {
  return apiAuthFetch<void>(`/medications/${id}`, { method: "DELETE" });
}
