"use client";

import { useCurrentUser } from "./useCurrentUser";
import {
  getActiveProfile,
  getDefaultBranch,
  getProfileOrganization,
  getProfileOrganizationId,
  getProfilePrimaryRole,
} from "@/features/auth/lib/current-user";
import { STAFF_ROLE } from "@/features/auth/lib/auth.constants";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";

/**
 * Centralises the extraction of user profile context used across dashboard
 * pages (StaffPage, VisitsPage, etc.).  Returns the current user query state
 * plus all commonly-needed derived values.
 */
export function useUserProfileContext() {
  const {
    data: currentUser,
    isLoading: isCurrentUserLoading,
    isError: isCurrentUserError,
  } = useCurrentUser();

  const selectedBranchId = useAuthContextStore((state) => state.branchId);

  const activeProfile = getActiveProfile(currentUser);
  const currentUserStaffId = activeProfile?.staff_id;
  const currentUserRole = getProfilePrimaryRole(activeProfile);
  const canManage = currentUserRole === STAFF_ROLE.OWNER;

  const organization = getProfileOrganization(activeProfile);
  const organizationId = getProfileOrganizationId(activeProfile);
  const organizationName = organization?.name;

  const activeBranch = getDefaultBranch(activeProfile, selectedBranchId);
  const branchId = activeBranch?.id;
  const branchName = activeBranch
    ? [activeBranch.address, activeBranch.city, activeBranch.governorate]
        .filter(Boolean)
        .join(", ")
    : undefined;

  return {
    currentUser,
    isCurrentUserLoading,
    isCurrentUserError,
    activeProfile,
    currentUserStaffId,
    currentUserRole,
    canManage,
    organization,
    organizationId,
    organizationName,
    activeBranch,
    branchId,
    branchName,
  };
}
