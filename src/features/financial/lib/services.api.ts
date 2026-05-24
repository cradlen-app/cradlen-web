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
  if (filters?.serviceType) params.set("serviceType", filters.serviceType);
  if (filters?.isActive != null) params.set("isActive", String(filters.isActive));
  if (filters?.search) params.set("search", filters.search);
  const qs = params.toString();
  return apiAuthFetch<ApiResponse<Service[]>>(
    `/organizations/${orgId}/financial/services${qs ? `?${qs}` : ""}`,
  );
}

export async function fetchService(orgId: string, id: string): Promise<ApiResponse<Service>> {
  return apiAuthFetch<ApiResponse<Service>>(
    `/api/backend/organizations/${orgId}/financial/services/${id}`,
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
