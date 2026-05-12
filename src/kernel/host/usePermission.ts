"use client";

import type { PermissionId } from "@/common/kernel-contracts";

import { useKernel } from "./KernelProvider";

/**
 * Returns `true` if the current auth context satisfies the named permission.
 * Returns `false` for unknown permission ids — matches the registry's policy.
 */
export function usePermission(id: PermissionId): boolean {
  const { registry, authContext } = useKernel();
  return registry.permissions.check(id, authContext);
}
