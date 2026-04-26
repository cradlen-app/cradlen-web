import { apiAuthFetch } from "@/lib/api";
import type { ApiStaffListResponse } from "../types/staff.api.types";

export function fetchStaff(organizationId: string, page = 1, limit = 100) {
  const params = new URLSearchParams({
    organization_id: organizationId,
    page: String(page),
    limit: String(limit),
  });
  return apiAuthFetch<ApiStaffListResponse>(`/staff?${params}`);
}
