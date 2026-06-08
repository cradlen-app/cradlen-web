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
  role?: string;
};

export type FetchStaffInvitationsOptions = {
  organizationId: string;
  branchId: string;
  limit?: number;
  page?: number;
};

function unwrap<T>(value: T | { data: T }): T {
  if (value && typeof value === "object" && "data" in (value as object)) {
    return (value as { data: T }).data;
  }
  return value as T;
}

export async function fetchRoles(): Promise<ApiStaffRole[]> {
  // Roles are global (not org-scoped); backend exposes a public lookup.
  const response = await apiAuthFetch<ApiRolesResponse>(`/roles/lookup`);
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
  branchId: string,
  { page = 1, limit = 100, search, role }: FetchStaffOptions,
) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  const trimmedSearch = search?.trim();
  if (trimmedSearch) params.set("search", trimmedSearch);
  if (role) params.set("role", role);
  return apiAuthFetch<ApiStaffListResponse>(
    `/organizations/${organizationId}/branches/${branchId}/staff?${params}`,
  );
}

export async function fetchAllStaff(
  organizationId: string,
  branchId: string,
  options: Omit<FetchStaffOptions, "page" | "limit"> = {},
  limit = 100,
): Promise<ApiStaffMember[]> {
  const firstPage = await fetchStaff(organizationId, branchId, { page: 1, limit, ...options });
  const all: ApiStaffMember[] = [...firstPage.data];
  for (let page = 2; page <= firstPage.meta.totalPages; page += 1) {
    const res = await fetchStaff(organizationId, branchId, { page, limit, ...options });
    all.push(...res.data);
  }
  return all;
}

export function inviteStaff(
  organizationId: string,
  branchId: string,
  data: InviteStaffRequest,
) {
  return apiAuthFetch<InviteStaffResponse>(
    `/organizations/${organizationId}/branches/${branchId}/invitations`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

export function createStaffDirect(
  organizationId: string,
  branchId: string,
  data: CreateStaffDirectRequest,
) {
  return apiAuthFetch<CreateStaffDirectResponse>(
    `/organizations/${organizationId}/branches/${branchId}/staff`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

export async function updateStaff(
  organizationId: string,
  branchId: string,
  staffId: string,
  data: UpdateStaffRequest,
): Promise<ApiStaffMember> {
  const response = await apiAuthFetch<UpdateStaffResponse>(
    `/organizations/${organizationId}/branches/${branchId}/staff/${staffId}`,
    { method: "PATCH", body: JSON.stringify(data) },
  );
  return unwrap<ApiStaffMember>(response as ApiStaffMemberResponse);
}

/**
 * DELETE /v1/organizations/:orgId/branches/:branchId/staff/:staffId
 * Removes the staff member from this branch. If it was their last branch the
 * backend soft-deletes the whole profile.
 */
export function removeStaffFromBranch(
  organizationId: string,
  branchId: string,
  staffId: string,
) {
  return apiAuthFetch<void>(
    `/organizations/${organizationId}/branches/${branchId}/staff/${staffId}`,
    { method: "DELETE" },
  );
}

export function fetchStaffInvitations({
  organizationId,
  branchId,
  limit = 100,
  page = 1,
}: FetchStaffInvitationsOptions) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  return apiAuthFetch<StaffInvitationsResponse>(
    `/organizations/${organizationId}/branches/${branchId}/invitations?${params}`,
  );
}

export function fetchStaffInvitation(
  organizationId: string,
  branchId: string,
  invitationId: string,
) {
  return apiAuthFetch<StaffInvitationResponse>(
    `/organizations/${organizationId}/branches/${branchId}/invitations/${invitationId}`,
  );
}

export function deleteStaffInvitation(
  organizationId: string,
  branchId: string,
  invitationId: string,
) {
  return apiAuthFetch<StaffInvitationActionResponse>(
    `/organizations/${organizationId}/branches/${branchId}/invitations/${invitationId}`,
    { method: "DELETE" },
  );
}

export function resendStaffInvitation(
  organizationId: string,
  branchId: string,
  invitationId: string,
) {
  return apiAuthFetch<void>(
    `/organizations/${organizationId}/branches/${branchId}/invitations/${invitationId}/resend`,
    { method: "POST" },
  );
}

export function getInvitationPreview(invitationId: string, token: string) {
  return apiFetch<ApiResponse<InvitationPreview>>(
    `/api/staff/invite/preview?invitation_id=${encodeURIComponent(invitationId)}&token=${encodeURIComponent(token)}`,
  );
}

export function declineStaffInvite(invitationId: string, token: string) {
  return apiFetch<{ message: string }>("/staff/invite/decline", {
    method: "POST",
    body: JSON.stringify({ invitation_id: invitationId, token }),
  });
}

export function acceptStaffInvite(data: AcceptStaffInviteRequest) {
  return apiFetch<AcceptStaffInviteResponse>("/staff/invite/accept", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
