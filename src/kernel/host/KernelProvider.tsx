"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import type { AuthContext } from "@/common/kernel-contracts";

import { bootModules } from "./bootModules";
import type { ModuleRegistry } from "../registry/ModuleRegistry";

interface KernelContextValue {
  readonly registry: ModuleRegistry;
  readonly authContext: AuthContext;
}

const KernelContext = createContext<KernelContextValue | null>(null);

export interface KernelProviderProps {
  readonly authContext: AuthContext;
  readonly children: ReactNode;
}

/**
 * Wraps the React tree with the kernel's registry + the current auth context.
 *
 * Boot is triggered at module-load time (idempotent), so callers can rely on
 * the registry being frozen before any provider mounts.
 */
export function KernelProvider({ authContext, children }: KernelProviderProps) {
  const value = useMemo<KernelContextValue>(
    () => ({ registry: bootModules(), authContext }),
    [authContext],
  );
  return <KernelContext.Provider value={value}>{children}</KernelContext.Provider>;
}

export function useKernel(): KernelContextValue {
  const value = useContext(KernelContext);
  if (!value) {
    throw new Error("useKernel must be used inside <KernelProvider>.");
  }
  return value;
}
