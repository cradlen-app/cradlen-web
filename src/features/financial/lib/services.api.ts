import { apiAuthFetch } from "@/infrastructure/http/api";
import type { ApiResponse } from "@/common/types/api.types";
import type {
  CreateServicePayload,
  Service,
  UpdateServicePayload,
} from "../types/financial.types";

// ── reads ─────────────────────────────────────────────────────────────────────

export function fetchServices(
  orgId: string,
  filters?: Record<string, string>,
): Promise<ApiResponse<Service[]>> {
  const params = new URLSearchParams(filters);
  const qs = params.toString();
  return apiAuthFetch<ApiResponse<Service[]>>(
    `/organizations/${orgId}/financial/services${qs ? `?${qs}` : ""}`,
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
