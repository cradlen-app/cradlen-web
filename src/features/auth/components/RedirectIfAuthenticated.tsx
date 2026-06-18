"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "@/i18n/navigation";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useAuthContextStore } from "../store/authContextStore";
import { getDefaultRouteForRole } from "../lib/redirect";
import {
  getActiveProfile,
  getBranchId,
  getProfileBranches,
  getProfileOrganizationId,
  getProfileRoles,
} from "../lib/current-user";
import { setPendingProfileSelection } from "../lib/profile-selection-session";

/**
 * Guard for public entry pages (home, sign-in, sign-up). When a user with a
 * live staff session lands here, send them straight into the dashboard instead
 * of showing sign-in again.
 *
 * Reuses the `/auth/me` query already fired globally by `KernelAuthBridge`, so
 * this adds no extra network request. A 401 (anonymous / mid-onboarding) yields
 * no `currentUser`, so those visitors are left untouched.
 */
export function RedirectIfAuthenticated() {
  const { data: currentUser, isLoading } = useCurrentUser();
  const organizationId = useAuthContextStore((state) => state.organizationId);
  const branchId = useAuthContextStore((state) => state.branchId);
  const router = useRouter();
  const redirected = useRef(false);

  useEffect(() => {
    if (redirected.current) return;
    if (isLoading || !currentUser) return;

    const profile = getActiveProfile(currentUser);

    // Preferred: route to the last active workspace saved in authContextStore.
    if (organizationId && branchId) {
      redirected.current = true;
      const role = getProfileRoles(profile)[0];
      router.replace(
        getDefaultRouteForRole(role, organizationId, branchId, profile),
      );
      return;
    }

    // No saved workspace, but a single profile with a single branch is
    // unambiguous — derive the destination directly.
    const profiles = currentUser.profiles ?? [];
    if (profiles.length === 1) {
      const only = profiles[0];
      const orgId = getProfileOrganizationId(only);
      const branches = getProfileBranches(only);
      if (orgId && branches.length === 1) {
        const bId = getBranchId(branches[0]);
        if (bId) {
          redirected.current = true;
          const role = getProfileRoles(only)[0];
          router.replace(getDefaultRouteForRole(role, orgId, bId, only));
          return;
        }
      }
    }

    // Ambiguous (multiple profiles / branches, no saved context) — let the user
    // pick which workspace to enter.
    if (profiles.length > 0) {
      redirected.current = true;
      setPendingProfileSelection({ profiles });
      router.replace("/select-profile");
    }
  }, [isLoading, currentUser, organizationId, branchId, router]);

  return null;
}
