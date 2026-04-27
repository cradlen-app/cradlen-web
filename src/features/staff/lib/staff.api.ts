import { apiAuthFetch } from "@/lib/api";
import type { ApiStaffListResponse, ApiStaffMember } from "../types/staff.api.types";

export function fetchStaff(organizationId: string, page = 1, limit = 100) {
  const params = new URLSearchParams({
    organization_id: organizationId,
    page: String(page),
    limit: String(limit),
  });
  return apiAuthFetch<ApiStaffListResponse>(`/staff?${params}`);
}

export async function fetchAllStaff(organizationId: string, limit = 100) {
  const firstPage = await fetchStaff(organizationId, 1, limit);
  const staff: ApiStaffMember[] = [...firstPage.data];
  const totalPages = firstPage.meta.totalPages;

  for (let page = 2; page <= totalPages; page += 1) {
    const res = await fetchStaff(organizationId, page, limit);
    staff.push(...res.data);
  }

  return staff;
}
