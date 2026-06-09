import { apiAuthFetch } from "@/infrastructure/http/api";
import type { ApiResponse } from "@/common/types/api.types";
import type {
  CreateCategoryPayload,
  ServiceCategory,
  UpdateCategoryPayload,
} from "../types/financial.types";

const base = (orgId: string) =>
  `/organizations/${orgId}/financial/catalog/categories`;

// ── reads ─────────────────────────────────────────────────────────────────────

export function fetchCategories(
  orgId: string,
  opts?: { active?: boolean; page?: number; limit?: number },
): Promise<ApiResponse<ServiceCategory[]>> {
  const params = new URLSearchParams();
  if (opts?.active != null) params.set("active", String(opts.active));
  if (opts?.page != null) params.set("page", String(opts.page));
  if (opts?.limit != null) params.set("limit", String(opts.limit));
  const qs = params.toString();
  return apiAuthFetch<ApiResponse<ServiceCategory[]>>(
    `${base(orgId)}${qs ? `?${qs}` : ""}`,
  );
}

// ── writes ────────────────────────────────────────────────────────────────────

export function createCategory(
  orgId: string,
  payload: CreateCategoryPayload,
): Promise<ApiResponse<ServiceCategory>> {
  return apiAuthFetch<ApiResponse<ServiceCategory>>(base(orgId), {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCategory(
  orgId: string,
  id: string,
  payload: UpdateCategoryPayload,
): Promise<ApiResponse<ServiceCategory>> {
  return apiAuthFetch<ApiResponse<ServiceCategory>>(`${base(orgId)}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteCategory(orgId: string, id: string): Promise<void> {
  return apiAuthFetch<void>(`${base(orgId)}/${id}`, { method: "DELETE" });
}
