"use client";

import { useMemo, type ReactNode } from "react";

import type { AuthContext, AuthProfile } from "@/common/kernel-contracts";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { getActiveProfile } from "@/features/auth/lib/current-user";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { KernelProvider } from "@/kernel";

/**
 * Materializes an `AuthContext` from the auth feature's stores and queries,
 * then wraps the tree with `KernelProvider`. This is the only place where
 * the kernel "knows" about the auth feature — by inversion of control via
 * a single React boundary.
 *
 * On public pages where the user is anonymous, `currentUser` is undefined
 * and the AuthContext is anonymous; kernel hooks then return safe defaults
 * (`usePluginNav` filters everything that requires a permission;
 * `usePermission` returns false).
 */
export function KernelAuthBridge({ children }: { children: ReactNode }) {
  const { data: currentUser } = useCurrentUser();
  const orgId = useAuthContextStore((state) => state.organizationId);
  const branchId = useAuthContextStore((state) => state.branchId);

  const authContext = useMemo<AuthContext>(() => {
    const profile = getActiveProfile(currentUser);
    return {
      user: currentUser
        ? { id: currentUser.id, email: currentUser.email }
        : null,
      profile: (profile ?? null) as AuthProfile | null,
      orgId: orgId ?? null,
      branchId: branchId ?? null,
    };
  }, [currentUser, orgId, branchId]);

  return <KernelProvider authContext={authContext}>{children}</KernelProvider>;
}
