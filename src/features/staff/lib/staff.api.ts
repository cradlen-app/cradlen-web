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
  StaffInvitationActionResponse,
  StaffInvitationResponse,
  StaffInvitationsResponse,
  StaffInvitePreviewResponse,
} from "../types/staff.api.types";

type FetchStaffOptions = {
  branchId: string;
  limit?: number;
  page?: number;
  q?: string;
  roleId?: string;
};

export type FetchStaffInvitationsOptions = {
  branchId: string;
  limit?: number;
  organizationId: string;
  page?: number;
  status?: string;
};

export async function fetchRoles(organizationId: string) {
  const params = new URLSearchParams({ organization_id: organizationId });
  const response = await apiAuthFetch<ApiRolesResponse>(`/roles?${params}`);
  return (Array.isArray(response) ? response : response.data) as ApiStaffRole[];
}

export function fetchStaff(
  organizationId: string,
  { branchId, page = 1, limit = 100, q, roleId }: FetchStaffOptions,
) {
  const params = new URLSearchParams({
    organization_id: organizationId,
    branch_id: branchId,
    page: String(page),
    limit: String(limit),
  });

  const search = q?.trim();
  if (search) {
    params.set("q", search);
  }

  if (roleId) {
    params.set("role_id", roleId);
  }

  return apiAuthFetch<ApiStaffListResponse>(`/staff?${params}`);
}

export async function fetchAllStaff(
  organizationId: string,
  { branchId, q, roleId }: Pick<FetchStaffOptions, "branchId" | "q" | "roleId">,
  limit = 100,
) {
  const firstPage = await fetchStaff(organizationId, { branchId, page: 1, limit, q, roleId });
  const staff: ApiStaffMember[] = [...firstPage.data];
  const totalPages = firstPage.meta.totalPages;

  for (let page = 2; page <= totalPages; page += 1) {
    const res = await fetchStaff(organizationId, { branchId, page, limit, q, roleId });
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

export function fetchStaffInvitations({
  branchId,
  limit = 100,
  organizationId,
  page = 1,
  status,
}: FetchStaffInvitationsOptions) {
  const params = new URLSearchParams({
    organization_id: organizationId,
    branch_id: branchId,
    page: String(page),
    limit: String(limit),
  });

  if (status && status !== "all") {
    params.set("status", status);
  }

  return apiAuthFetch<StaffInvitationsResponse>(`/staff/invitations?${params}`);
}

export function fetchStaffInvitation(invitationId: string) {
  return apiAuthFetch<StaffInvitationResponse>(`/staff/invitations/${invitationId}`);
}

export function deleteStaffInvitation(invitationId: string) {
  return apiAuthFetch<StaffInvitationActionResponse>(`/staff/invitations/${invitationId}`, {
    method: "DELETE",
  });
}

export function resendStaffInvitation(invitationId: string) {
  return apiAuthFetch<StaffInvitationActionResponse>(
    `/staff/invitations/${invitationId}/resend`,
    { method: "POST" },
  );
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
