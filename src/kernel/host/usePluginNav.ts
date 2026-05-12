"use client";

import { useMemo } from "react";

import type { NavItem } from "@/common/kernel-contracts";

import { useKernel } from "./KernelProvider";

/** Returns nav items the current auth context is allowed to see. */
export function usePluginNav(): readonly NavItem[] {
  const { registry, authContext } = useKernel();
  return useMemo(
    () => registry.nav.visibleFor(authContext, registry.permissions),
    [registry, authContext],
  );
}
