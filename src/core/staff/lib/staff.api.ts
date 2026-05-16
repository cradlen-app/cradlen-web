import { apiAuthFetch, apiFetch } from "@/infrastructure/http/api";
import type { ApiResponse } from "@/common/types/api.types";
import type {
  AcceptStaffInviteRequest,
  AcceptStaffInviteResponse,
  ApiJobFunctionsResponse,
  ApiRolesResponse,
  ApiSpecialtiesResponse,
  ApiStaffJobFunction,
  ApiStaffListResponse,
  ApiStaffMember,
  ApiStaffMemberResponse,
  ApiStaffRole,
  ApiStaffSpecialty,
  BulkInviteResponse,
  BulkInviteStaffRequest,
  CreateStaffDirectRequest,
  CreateStaffDirectResponse,
  InvitationPreview,
  InviteStaffRequest,
  InviteStaffResponse,
  StaffInvitationActionResponse,
  StaffInvitationResponse,
  StaffInvitationsResponse,
  UpdateStaffRequest,
  UpdateStaffResponse,
} from "../types/staff.api.types";

type FetchStaffOptions = {
  limit?: number;
  page?: number;
  search?: string;
  roleId?: string;
  branchId?: string;
  role?: string;
  scope?: "org" | "mine";
};

export type FetchStaffInvitationsOptions = {
  organizationId: string;
  limit?: number;
  page?: number;
};

function unwrap<T>(value: T | { data: T }): T {
  if (value && typeof value === "object" && "data" in (value as object)) {
    return (value as { data: T }).data;
  }
  return value as T;
}

export async function fetchRoles(organizationId: string): Promise<ApiStaffRole[]> {
  const response = await apiAuthFetch<ApiRolesResponse>(
    `/organizations/${organizationId}/roles`,
  );
  return Array.isArray(response) ? response : response.data;
}

export async function fetchJobFunctions(): Promise<ApiStaffJobFunction[]> {
  const response = await apiAuthFetch<ApiJobFunctionsResponse>(`/job-functions/lookup`);
  return Array.isArray(response) ? response : response.data;
}

export async function fetchSpecialties(): Promise<ApiStaffSpecialty[]> {
  const response = await apiAuthFetch<ApiSpecialtiesResponse>(`/specialties`);
  return Array.isArray(response) ? response : response.data;
}

export function fetchStaff(
  organizationId: string,
  { page = 1, limit = 100, search, roleId, branchId, role, scope }: FetchStaffOptions,
) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  const trimmedSearch = search?.trim();
  if (trimmedSearch) params.set("search", trimmedSearch);
  if (roleId) params.set("role_id", roleId);
  if (branchId) params.set("branch_id", branchId);
  if (role) params.set("role", role);
  if (scope) params.set("scope", scope);
  return apiAuthFetch<ApiStaffListResponse>(`/organizations/${organizationId}/staff?${params}`);
}

export async function fetchAllStaff(
  organizationId: string,
  options: Omit<FetchStaffOptions, "page" | "limit"> = {},
  limit = 100,
): Promise<ApiStaffMember[]> {
  const firstPage = await fetchStaff(organizationId, { page: 1, limit, ...options });
  const all: ApiStaffMember[] = [...firstPage.data];
  for (let page = 2; page <= firstPage.meta.totalPages; page += 1) {
    const res = await fetchStaff(organizationId, { page, limit, ...options });
    all.push(...res.data);
  }
  return all;
}

export function inviteStaff(organizationId: string, data: InviteStaffRequest) {
  return apiAuthFetch<InviteStaffResponse>(`/organizations/${organizationId}/invitations`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function bulkInviteStaff(organizationId: string, data: BulkInviteStaffRequest) {
  return apiAuthFetch<BulkInviteResponse>(`/organizations/${organizationId}/invitations/bulk`, {
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

export async function updateStaff(
  organizationId: string,
  staffId: string,
  data: UpdateStaffRequest,
): Promise<ApiStaffMember> {
  const response = await apiAuthFetch<UpdateStaffResponse>(
    `/organizations/${organizationId}/staff/${staffId}`,
    { method: "PATCH", body: JSON.stringify(data) },
  );
  return unwrap<ApiStaffMember>(response as ApiStaffMemberResponse);
}

export function deactivateStaff(organizationId: string, staffId: string) {
  return apiAuthFetch<void>(`/organizations/${organizationId}/staff/${staffId}`, {
    method: "DELETE",
  });
}

/** DELETE /v1/organizations/:orgId/staff/:staffId/branches/:branchId */
export function unassignStaffFromBranch(
  organizationId: string,
  staffId: string,
  branchId: string,
) {
  return apiAuthFetch<void>(
    `/organizations/${organizationId}/staff/${staffId}/branches/${branchId}`,
    { method: "DELETE" },
  );
}

export function fetchStaffInvitations({
  organizationId,
  limit = 100,
  page = 1,
}: FetchStaffInvitationsOptions) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  return apiAuthFetch<StaffInvitationsResponse>(
    `/organizations/${organizationId}/invitations?${params}`,
  );
}

export function fetchStaffInvitation(organizationId: string, invitationId: string) {
  return apiAuthFetch<StaffInvitationResponse>(
    `/organizations/${organizationId}/invitations/${invitationId}`,
  );
}

export function deleteStaffInvitation(organizationId: string, invitationId: string) {
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
  return apiFetch<ApiResponse<InvitationPreview>>(
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
