import { apiAuthFetch, apiFetch } from "@/lib/api";
import type {
  ApiRolesResponse,
  AcceptStaffInviteRequest,
  AcceptStaffInviteResponse,
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
  accountId: string;
  limit?: number;
  page?: number;
  status?: string;
};

type BranchScopedOptions = {
  branchId: string;
  organizationId: string;
};

export async function fetchRoles(accountId: string) {
  const response = await apiAuthFetch<ApiRolesResponse>(`/accounts/${accountId}/roles`);
  return (Array.isArray(response) ? response : response.data) as ApiStaffRole[];
}

export function fetchStaff(
  accountId: string,
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

  return apiAuthFetch<ApiStaffListResponse>(`/accounts/${accountId}/staff?${params}`);
}

export async function fetchAllStaff(
  accountId: string,
  { q, roleId }: Pick<FetchStaffOptions, "q" | "roleId">,
  limit = 100,
) {
  const firstPage = await fetchStaff(accountId, { page: 1, limit, q, roleId });
  const staff: NewApiStaffMember[] = [...firstPage.data];
  const totalPages = firstPage.meta.totalPages;

  for (let page = 2; page <= totalPages; page += 1) {
    const res = await fetchStaff(accountId, { page, limit, q, roleId });
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

export function inviteStaff(accountId: string, data: InviteStaffRequest) {
  return apiAuthFetch<InviteStaffResponse>(`/accounts/${accountId}/invitations`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function createStaffDirect(accountId: string, data: CreateStaffDirectRequest) {
  return apiAuthFetch<CreateStaffDirectResponse>(`/accounts/${accountId}/staff`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateStaff(
  staffId: string,
  data: UpdateStaffRequest,
  options: BranchScopedOptions,
) {
  return apiAuthFetch<UpdateStaffResponse>(`/staff/${staffId}?${getBranchScopedParams(options)}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deactivateStaff(staffId: string, options: BranchScopedOptions) {
  return apiAuthFetch<void>(`/staff/${staffId}?${getBranchScopedParams(options)}`, {
    method: "DELETE",
  });
}

export function fetchStaffInvitations({
  accountId,
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

  return apiAuthFetch<StaffInvitationsResponse>(`/accounts/${accountId}/invitations?${params}`);
}

export function fetchStaffInvitation(accountId: string, invitationId: string) {
  return apiAuthFetch<StaffInvitationResponse>(
    `/accounts/${accountId}/invitations/${invitationId}`,
  );
}

export function deleteStaffInvitation(
  accountId: string,
  invitationId: string,
) {
  return apiAuthFetch<StaffInvitationActionResponse>(
    `/accounts/${accountId}/invitations/${invitationId}`,
    { method: "DELETE" },
  );
}

export function resendStaffInvitation(accountId: string, invitationId: string) {
  return apiAuthFetch<void>(
    `/accounts/${accountId}/invitations/${invitationId}/resend`,
    { method: "POST" },
  );
}

export function acceptStaffInvite(data: AcceptStaffInviteRequest) {
  return apiFetch<AcceptStaffInviteResponse>("/staff/invite/accept", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
