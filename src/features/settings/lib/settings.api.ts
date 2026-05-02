import { apiAuthFetch } from "@/lib/api";

export type UpdateAccountProfileRequest = {
  first_name?: string;
  is_clinical?: boolean;
  job_title?: string;
  last_name?: string;
  organization_id?: string;
  phone_number?: string;
  specialty?: string;
};

export type CreateOrganizationRequest = {
  address: string;
  city: string;
  country: string;
  governorate: string;
  is_clinical?: boolean;
  job_title?: string;
  name: string;
  specialities?: string[];
  specialty?: string;
};

export type UpdateOrganizationRequest = {
  name?: string;
  specialities?: string[];
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
};

export type CreateBranchRequest = {
  address: string;
  city: string;
  country?: string;
  governorate: string;
  is_main?: boolean;
  name: string;
  organization_id: string;
};

export type UpdateBranchRequest = {
  address?: string;
  city?: string;
  country?: string;
  governorate?: string;
  is_main?: boolean;
  name?: string;
};

export function updateAccountProfile(data: UpdateAccountProfileRequest) {
  return apiAuthFetch("/account/profile", {
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
  return apiAuthFetch("/owner/organizations", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateOrganization(
  organizationId: string,
  data: UpdateOrganizationRequest,
) {
  return apiAuthFetch(`/owner/organizations/${organizationId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteOrganization(organizationId: string) {
  return apiAuthFetch(`/owner/organizations/${organizationId}`, {
    method: "DELETE",
  });
}

export function createBranch(data: CreateBranchRequest) {
  return apiAuthFetch("/owner/branches", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateBranch(
  branchId: string,
  organizationId: string,
  data: UpdateBranchRequest,
) {
  const params = new URLSearchParams({ organization_id: organizationId });

  return apiAuthFetch(`/owner/branches/${branchId}?${params}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteBranch(branchId: string, organizationId: string) {
  const params = new URLSearchParams({ organization_id: organizationId });

  return apiAuthFetch(`/owner/branches/${branchId}?${params}`, {
    method: "DELETE",
  });
}
