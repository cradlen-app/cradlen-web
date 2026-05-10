"use client";

import { useCurrentUser } from "./useCurrentUser";
import {
  getActiveProfile,
  getBranchId,
  getDefaultBranch,
  getProfileOrganization,
  getProfileOrganizationId,
} from "@/features/auth/lib/current-user";
import {
  canCreateVisit,
  canManageStaff,
  canSearchPatients,
  canUseSettings,
  canViewStaff,
  hasAnyStaffRole,
  isBranchManager,
  isClinical,
  isOwner,
  isReceptionist,
  showsAssignedVisits,
  showsBranchAggregate,
} from "@/features/auth/lib/permissions";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { formatBranchLocation } from "@/lib/branch.utils";

/**
 * Centralises the extraction of user profile context used across dashboard
 * pages. Returns the current user query state plus all commonly-needed derived
 * values, including the new permission flags backed by the Role + JobFunction
 * taxonomy in `permissions.ts`.
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

  const organization = getProfileOrganization(activeProfile);
  const organizationId = getProfileOrganizationId(activeProfile);
  const organizationName = organization?.name;

  const activeBranch = getDefaultBranch(activeProfile, selectedBranchId);
  const branchId = getBranchId(activeBranch);
  const branchName = formatBranchLocation(activeBranch);

  return {
    currentUser,
    isCurrentUserLoading,
    isCurrentUserError,
    activeProfile,
    currentUserStaffId,
    organization,
    organizationId,
    organizationName,
    activeBranch,
    branchId,
    branchName,
    // Permission flags
    isOwner: isOwner(activeProfile),
    isBranchManager: isBranchManager(activeProfile),
    isReceptionist: isReceptionist(activeProfile),
    isClinical: isClinical(activeProfile),
    hasAnyStaffRole: hasAnyStaffRole(activeProfile),
    canViewStaff: canViewStaff(activeProfile),
    canManageStaff: canManageStaff(activeProfile),
    canUseSettings: canUseSettings(activeProfile),
    canCreateVisit: canCreateVisit(activeProfile),
    canSearchPatients: canSearchPatients(activeProfile),
    showsAssignedVisits: showsAssignedVisits(activeProfile),
    showsBranchAggregate: showsBranchAggregate(activeProfile),
    /** @deprecated Use `canManageStaff` for staff-area gating. */
    canManage: canManageStaff(activeProfile),
  };
}
