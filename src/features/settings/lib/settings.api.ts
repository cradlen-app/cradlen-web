import { apiAuthFetch, apiFetch } from "@/lib/api";

export type AccountBranch = {
  id: string;
  name: string;
  address: string;
  city: string;
  governorate: string;
  country: string | null;
  is_main: boolean;
  status: string;
};

export const branchesQueryKey = (accountId: string) => ["branches", accountId];

export type UpdateAccountProfileRequest = {
  first_name?: string;
  is_clinical?: boolean;
  job_title?: string;
  last_name?: string;
  phone_number?: string;
  specialty?: string;
};

export type CreateOrganizationRequest = {
  account_name: string;
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

export function updateAccountProfile(
  profileId: string,
  data: UpdateAccountProfileRequest,
) {
  return apiAuthFetch(`/profiles/${profileId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deactivateAccount(data: { reason?: string } = {}) {
  return apiAuthFetch<{ user_id: string; is_active: false }>(
    "/account/deactivate",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

export function createOrganization(data: CreateOrganizationRequest) {
  return apiAuthFetch("/accounts", {
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
  return apiAuthFetch(`/accounts/${organizationId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteOrganization(organizationId: string) {
  return apiAuthFetch(`/accounts/${organizationId}`, {
    method: "DELETE",
  });
}

export function createBranch(
  organizationId: string,
  data: CreateBranchRequest,
) {
  return apiAuthFetch(`/accounts/${organizationId}/branches`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateBranch(
  organizationId: string,
  branchId: string,
  data: UpdateBranchRequest,
) {
  return apiAuthFetch(`/accounts/${organizationId}/branches/${branchId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteBranch(organizationId: string, branchId: string) {
  return apiAuthFetch(`/accounts/${organizationId}/branches/${branchId}`, {
    method: "DELETE",
  });
}

export function listBranches(accountId: string) {
  return apiAuthFetch<{ data: AccountBranch[] }>(
    `/accounts/${accountId}/branches`,
  );
}
