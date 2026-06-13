import { apiAuthFetch } from "@/infrastructure/http/api";
import type {
  Medication,
  MedicationFacets,
  MedicationListResponse,
  CreateMedicationRequest,
  UpdateMedicationRequest,
} from "../types/medications.types";
import type { MedicationListParams } from "./medications.queryKeys";

export function fetchMedications({
  page,
  limit,
  search,
  category,
  form,
  sort,
}: MedicationListParams) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search.trim()) params.set("search", search.trim());
  if (category) params.set("category", category);
  if (form) params.set("form", form);
  if (sort && sort !== "name") params.set("sort", sort);
  return apiAuthFetch<MedicationListResponse>(`/medications?${params}`);
}

export function fetchMedicationFacets() {
  return apiAuthFetch<MedicationFacets>("/medications/facets");
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
