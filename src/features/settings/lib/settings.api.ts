import { apiAuthFetch, apiFetch } from "@/lib/api";
import type { ApiResponse } from "@/types/api.types";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { queryKeys } from "@/lib/queryKeys";

export type OrganizationBranch = {
  id: string;
  name: string;
  address: string;
  city: string;
  governorate: string;
  country: string | null;
  is_main: boolean;
  status: string;
};

/** @deprecated Use `queryKeys.settings.branches(organizationId)` directly instead. */
export const branchesQueryKey = (organizationId: string) =>
  queryKeys.settings.branches(organizationId);

export type UpdateProfileRequest = {
  first_name?: string;
  is_clinical?: boolean;
  job_title?: string;
  last_name?: string;
  phone_number?: string;
  specialty?: string;
};

export type CreateOrganizationRequest = {
  organization_name: string;
  branch_name: string;
  branch_address: string;
  branch_city: string;
  branch_governorate: string;
  branch_country?: string;
  specialties: string[];
  roles: string[];
  specialty?: string;
  job_title?: string;
};

export type UpdateOrganizationRequest = {
  name?: string;
  specialities?: string[];
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
};

export type CreateBranchRequest = {
  name: string;
  address: string;
  city?: string;
  country?: string;
  governorate?: string;
  is_main?: boolean;
};

export type UpdateBranchRequest = {
  address?: string;
  city?: string;
  country?: string;
  governorate?: string;
  is_main?: boolean;
  name?: string;
};

export function updateProfile(
  profileId: string,
  data: UpdateProfileRequest,
) {
  return apiAuthFetch(`/profiles/${profileId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deactivateOrganization() {
  const { organizationId } = useAuthContextStore.getState();
  return apiAuthFetch<void>(`/organizations/${organizationId}`, { method: "DELETE" });
}

export function createOrganization(data: CreateOrganizationRequest) {
  return apiAuthFetch("/organizations", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function createOrganizationSession(data: CreateOrganizationRequest) {
  return apiFetch("/api/auth/create-organization", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateOrganization(
  organizationId: string,
  data: UpdateOrganizationRequest,
) {
  return apiAuthFetch(`/organizations/${organizationId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteOrganization(organizationId: string) {
  return apiAuthFetch(`/organizations/${organizationId}`, {
    method: "DELETE",
  });
}

export function createBranch(
  organizationId: string,
  data: CreateBranchRequest,
) {
  return apiAuthFetch(`/organizations/${organizationId}/branches`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateBranch(
  organizationId: string,
  branchId: string,
  data: UpdateBranchRequest,
) {
  return apiAuthFetch(`/organizations/${organizationId}/branches/${branchId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteBranch(organizationId: string, branchId: string) {
  return apiAuthFetch(`/organizations/${organizationId}/branches/${branchId}`, {
    method: "DELETE",
  });
}

export function listBranches(organizationId: string) {
  return apiAuthFetch<ApiResponse<OrganizationBranch[]>>(
    `/organizations/${organizationId}/branches`,
  );
}
