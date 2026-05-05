import { apiAuthFetch, apiFetch } from "@/lib/api";
import type {
  ApiRolesResponse,
  AcceptStaffInviteRequest,
  AcceptStaffInviteResponse,
  InvitationPreview,
  InviteStaffRequest,
  InviteStaffResponse,
  ApiStaffListResponse,
  NewApiStaffMember,
  ApiStaffRole,
  StaffInvitationActionResponse,
  StaffInvitationResponse,
  StaffInvitationsResponse,
  StaffMemberResponse,
  UpdateStaffRequest,
  UpdateStaffResponse,
  CreateStaffDirectRequest,
  CreateStaffDirectResponse,
} from "../types/staff.api.types";

type FetchStaffOptions = {
  limit?: number;
  page?: number;
  q?: string;
  roleId?: string;
};

export type FetchStaffInvitationsOptions = {
  organizationId: string;
  limit?: number;
  page?: number;
  status?: string;
};

type BranchScopedOptions = {
  branchId: string;
  organizationId: string;
};

export async function fetchRoles(organizationId: string) {
  const response = await apiAuthFetch<ApiRolesResponse>(`/organizations/${organizationId}/roles`);
  return (Array.isArray(response) ? response : response.data) as ApiStaffRole[];
}

export function fetchStaff(
  organizationId: string,
  { page = 1, limit = 100, q, roleId }: FetchStaffOptions,
) {
  const params = new URLSearchParams({
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

  return apiAuthFetch<ApiStaffListResponse>(`/organizations/${organizationId}/staff?${params}`);
}

export async function fetchAllStaff(
  organizationId: string,
  { q, roleId }: Pick<FetchStaffOptions, "q" | "roleId">,
  limit = 100,
) {
  const firstPage = await fetchStaff(organizationId, { page: 1, limit, q, roleId });
  const staff: NewApiStaffMember[] = [...firstPage.data];
  const totalPages = firstPage.meta.totalPages;

  for (let page = 2; page <= totalPages; page += 1) {
    const res = await fetchStaff(organizationId, { page, limit, q, roleId });
    staff.push(...res.data);
  }

  return staff;
}

function getBranchScopedParams({ branchId, organizationId }: BranchScopedOptions) {
  return new URLSearchParams({
    organization_id: organizationId,
    branch_id: branchId,
  });
}

export function fetchStaffMember(
  staffId: string,
  options: BranchScopedOptions,
) {
  return apiAuthFetch<StaffMemberResponse>(
    `/staff/${staffId}?${getBranchScopedParams(options)}`,
  );
}

export function inviteStaff(organizationId: string, data: InviteStaffRequest) {
  return apiAuthFetch<InviteStaffResponse>(`/organizations/${organizationId}/invitations`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function createStaffDirect(organizationId: string, data: CreateStaffDirectRequest) {
  return apiAuthFetch<CreateStaffDirectResponse>(`/organizations/${organizationId}/staff`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateStaff(
  staffId: string,
  data: UpdateStaffRequest,
  options: BranchScopedOptions,
) {
  return apiAuthFetch<UpdateStaffResponse>(`/organizations/${options.organizationId}/staff/${staffId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deactivateStaff(staffId: string, options: BranchScopedOptions) {
  return apiAuthFetch<void>(`/organizations/${options.organizationId}/staff/${staffId}`, {
    method: "DELETE",
  });
}

export function fetchStaffInvitations({
  organizationId,
  limit = 100,
  page = 1,
  status,
}: FetchStaffInvitationsOptions) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (status && status !== "all") {
    params.set("status", status.toUpperCase());
  }

  return apiAuthFetch<StaffInvitationsResponse>(`/organizations/${organizationId}/invitations?${params}`);
}

export function fetchStaffInvitation(organizationId: string, invitationId: string) {
  return apiAuthFetch<StaffInvitationResponse>(
    `/organizations/${organizationId}/invitations/${invitationId}`,
  );
}

export function deleteStaffInvitation(
  organizationId: string,
  invitationId: string,
) {
  return apiAuthFetch<StaffInvitationActionResponse>(
    `/organizations/${organizationId}/invitations/${invitationId}`,
    { method: "DELETE" },
  );
}

export function resendStaffInvitation(organizationId: string, invitationId: string) {
  return apiAuthFetch<void>(
    `/organizations/${organizationId}/invitations/${invitationId}/resend`,
    { method: "POST" },
  );
}

export function getInvitationPreview(invitation: string, token: string) {
  return apiFetch<{ data: InvitationPreview }>(
    `/api/staff/invite/preview?invitation=${encodeURIComponent(invitation)}&token=${encodeURIComponent(token)}`,
  );
}

export function declineStaffInvite(invitation: string, token: string) {
  return apiFetch<{ message: string }>("/staff/invite/decline", {
    method: "POST",
    body: JSON.stringify({ invitation, token }),
  });
}

export function acceptStaffInvite(data: AcceptStaffInviteRequest) {
  return apiFetch<AcceptStaffInviteResponse>("/staff/invite/accept", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
