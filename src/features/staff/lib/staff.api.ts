import { apiAuthFetch, apiFetch } from "@/lib/api";
import type {
  ApiRolesResponse,
  AcceptStaffInviteRequest,
  AcceptStaffInviteResponse,
  InviteStaffRequest,
  InviteStaffResponse,
  ApiStaffListResponse,
  ApiStaffMember,
  ApiStaffRole,
  StaffInvitePreviewResponse,
} from "../types/staff.api.types";

type FetchStaffOptions = {
  limit?: number;
  page?: number;
  roleId?: string;
};

export async function fetchRoles() {
  const response = await apiAuthFetch<ApiRolesResponse>("/roles");
  return (Array.isArray(response) ? response : response.data) as ApiStaffRole[];
}

export function fetchStaff(
  organizationId: string,
  { page = 1, limit = 100, roleId }: FetchStaffOptions = {},
) {
  const params = new URLSearchParams({
    organization_id: organizationId,
    page: String(page),
    limit: String(limit),
  });

  if (roleId) {
    params.set("role_id", roleId);
  }

  return apiAuthFetch<ApiStaffListResponse>(`/staff?${params}`);
}

export async function fetchAllStaff(organizationId: string, roleId?: string, limit = 100) {
  const firstPage = await fetchStaff(organizationId, { page: 1, limit, roleId });
  const staff: ApiStaffMember[] = [...firstPage.data];
  const totalPages = firstPage.meta.totalPages;

  for (let page = 2; page <= totalPages; page += 1) {
    const res = await fetchStaff(organizationId, { page, limit, roleId });
    staff.push(...res.data);
  }

  return staff;
}

export function inviteStaff(data: InviteStaffRequest) {
  return apiAuthFetch<InviteStaffResponse>("/staff/invite", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function previewStaffInvite(token: string, invitationId: string) {
  const params = new URLSearchParams({ token, invite: invitationId });
  return apiFetch<StaffInvitePreviewResponse>(`/staff/invite/preview?${params}`);
}

export function acceptStaffInvite(data: AcceptStaffInviteRequest) {
  return apiFetch<AcceptStaffInviteResponse>("/staff/invite/accept", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
