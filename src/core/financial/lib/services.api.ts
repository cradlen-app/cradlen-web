import { apiAuthFetch } from "@/infrastructure/http/api";
import type { ApiResponse } from "@/common/types/api.types";
import type {
  CreateServicePayload,
  Service,
  ServiceFilters,
  UpdateServicePayload,
} from "../types/financial.types";

// ── reads ─────────────────────────────────────────────────────────────────────

export function fetchServices(
  orgId: string,
  filters?: ServiceFilters,
): Promise<ApiResponse<Service[]>> {
  const params = new URLSearchParams();
  if (filters?.service_type) params.set("service_type", filters.service_type);
  if (filters?.specialty_id) params.set("specialty_id", filters.specialty_id);
  if (filters?.active != null) params.set("active", String(filters.active));
  if (filters?.page != null) params.set("page", String(filters.page));
  if (filters?.limit != null) params.set("limit", String(filters.limit));
  const qs = params.toString();
  return apiAuthFetch<ApiResponse<Service[]>>(
    `/organizations/${orgId}/financial/services${qs ? `?${qs}` : ""}`,
  );
}

export async function fetchService(orgId: string, id: string): Promise<ApiResponse<Service>> {
  return apiAuthFetch<ApiResponse<Service>>(
    `/organizations/${orgId}/financial/services/${id}`,
  );
}

// ── writes ────────────────────────────────────────────────────────────────────

export function createService(
  orgId: string,
  payload: CreateServicePayload,
): Promise<ApiResponse<Service>> {
  return apiAuthFetch<ApiResponse<Service>>(
    `/organizations/${orgId}/financial/services`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function updateService(
  orgId: string,
  id: string,
  payload: UpdateServicePayload,
): Promise<ApiResponse<Service>> {
  return apiAuthFetch<ApiResponse<Service>>(
    `/organizations/${orgId}/financial/services/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function deleteService(orgId: string, id: string): Promise<void> {
  return apiAuthFetch<void>(`/organizations/${orgId}/financial/services/${id}`, {
    method: "DELETE",
  });
}

export function activateService(
  orgId: string,
  id: string,
): Promise<ApiResponse<Service>> {
  return apiAuthFetch<ApiResponse<Service>>(
    `/organizations/${orgId}/financial/services/${id}/activate`,
    { method: "POST" },
  );
}

export function deactivateService(
  orgId: string,
  id: string,
): Promise<ApiResponse<Service>> {
  return apiAuthFetch<ApiResponse<Service>>(
    `/organizations/${orgId}/financial/services/${id}/deactivate`,
    { method: "POST" },
  );
}
