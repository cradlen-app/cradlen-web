import { apiAuthFetch, apiFetch } from "@/infrastructure/http/api";
import type { ApiResponse } from "@/common/types/api.types";
import type { EngagementType, ExecutiveTitle } from "@/common/types/user.types";
import { queryKeys } from "@/lib/queryKeys";

export interface OrgSpecialty {
  id: string;
  code: string;
  name: string;
}

export function fetchOrgSpecialties(
  organizationId: string,
): Promise<{ data: OrgSpecialty[] }> {
  return apiAuthFetch<{ data: OrgSpecialty[] }>(
    `/organizations/${organizationId}/specialties`,
  );
}

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
  /** USER-LEVEL — shared across all the user's profiles. */
  first_name?: string;
  /** USER-LEVEL — shared across all the user's profiles. */
  last_name?: string;
  /** USER-LEVEL — shared across all the user's profiles. */
  phone_number?: string;
  /** USER-LEVEL — ISO date string; pass null to clear. */
  date_of_birth?: string | null;
  /** PROFILE-LEVEL — free-text display title; pass null/"" to clear. */
  professional_title?: string | null;
  /** PROFILE-LEVEL — pass null to clear. */
  executive_title?: ExecutiveTitle | null;
  /** PROFILE-LEVEL — non-nullable on PATCH. */
  engagement_type?: EngagementType;
  /** PROFILE-LEVEL — single job function; pass null to clear. */
  job_function_code?: string | null;
  /** PROFILE-LEVEL — replace semantics; [] clears. */
  specialty_codes?: string[];
};

export type CreateOrganizationRequest = {
  organization_name: string;
  branch_name: string;
  branch_address: string;
  branch_city: string;
  branch_governorate: string;
  branch_country?: string;
  specialties: string[];
};

export type UpdateOrganizationRequest = {
  name?: string;
  /** Replace semantics; [] clears. Codes or names (case-insensitive). */
  specialties?: string[];
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

/** Response of `POST /profiles/:id/image-upload-url`. */
export type ApiProfileImageUploadUrl = {
  key: string;
  upload_url: string;
  expires_in: number;
  content_type: string;
};

/**
 * Presigned-R2 avatar upload (mirrors the patient portal): ask the backend for
 * a presigned PUT, upload the bytes straight to R2, then confirm the object key.
 */
export async function uploadProfileImage(profileId: string, file: File) {
  const presign = await apiAuthFetch<{ data: ApiProfileImageUploadUrl }>(
    `/profiles/${profileId}/image-upload-url`,
    {
      method: "POST",
      body: JSON.stringify({
        content_type: file.type,
        size_bytes: file.size,
        file_name: file.name,
      }),
    },
  );

  const put = await fetch(presign.data.upload_url, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": presign.data.content_type },
  });
  if (!put.ok) throw new Error("Upload failed");

  return apiAuthFetch(`/profiles/${profileId}/image`, {
    method: "POST",
    body: JSON.stringify({ key: presign.data.key }),
  });
}

export function removeProfileImage(profileId: string) {
  return apiAuthFetch(`/profiles/${profileId}/image`, { method: "DELETE" });
}

/** Response of `POST /organizations/:id/image-upload-url`. */
export type ApiOrganizationImageUploadUrl = {
  key: string;
  upload_url: string;
  expires_in: number;
  content_type: string;
};

/**
 * Presigned-R2 logo upload (mirrors {@link uploadProfileImage}): ask the backend
 * for a presigned PUT, upload the bytes straight to R2, then confirm the key.
 */
export async function uploadOrganizationLogo(
  organizationId: string,
  file: File,
) {
  const presign = await apiAuthFetch<{ data: ApiOrganizationImageUploadUrl }>(
    `/organizations/${organizationId}/image-upload-url`,
    {
      method: "POST",
      body: JSON.stringify({
        content_type: file.type,
        size_bytes: file.size,
        file_name: file.name,
      }),
    },
  );

  const put = await fetch(presign.data.upload_url, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": presign.data.content_type },
  });
  if (!put.ok) throw new Error("Upload failed");

  return apiAuthFetch(`/organizations/${organizationId}/image`, {
    method: "POST",
    body: JSON.stringify({ key: presign.data.key }),
  });
}

export function removeOrganizationLogo(organizationId: string) {
  return apiAuthFetch(`/organizations/${organizationId}/image`, {
    method: "DELETE",
  });
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

/**
 * Soft-deletes the organization and cascades to branches, profiles, and the
 * calling user when this is their last profile. After success, the caller MUST
 * sign out and redirect to /sign-in.
 */
export function deleteOrganization(organizationId: string) {
  return apiAuthFetch<void>(`/organizations/${organizationId}`, {
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
