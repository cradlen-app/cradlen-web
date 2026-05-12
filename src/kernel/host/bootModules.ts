import type { ModuleManifest, NavItem } from "@/common/kernel-contracts";


import staffManifest from "@/core/staff/manifest";

import { kernelEvents } from "../events";
import { ModuleRegistry } from "../registry/ModuleRegistry";

/**
 * Static manifest list. Every core module and plugin that participates in
 * the kernel registers here. Order is the registration order (does not
 * affect nav ordering — that's driven by `NavItem.order`).
 */
function listManifests(): readonly ModuleManifest[] {
  return [staffManifest];
}

/**
 * Optional legacy nav items contributed by code that hasn't migrated to a
 * manifest yet. Stays empty in Phase A.
 */
function listLegacyNav(): readonly NavItem[] {
  return [];
}

const serverRegistry = new ModuleRegistry();
const clientRegistry = new ModuleRegistry();

function currentRuntime(): "server" | "client" {
  return typeof window === "undefined" ? "server" : "client";
}

/**
 * Idempotent. Safe to call from a server entry (e.g. `getRequestConfig`,
 * the root layout) and from a top-level client provider. Re-calls on a
 * frozen registry are a no-op and return the same instance.
 */
export function bootModules(): ModuleRegistry {
  const runtime = currentRuntime();
  const registry = runtime === "server" ? serverRegistry : clientRegistry;

  if (registry.isFrozen) {
    return registry;
  }

  for (const manifest of listManifests()) {
    registry.register(manifest);
    kernelEvents.emit({ type: "module-registered", moduleId: manifest.id });
  }
  registry.registerLegacyNav(listLegacyNav());
  registry.freeze();
  kernelEvents.emit({ type: "registry-frozen", runtime });
  return registry;
}

/**
 * Test-only: drops both registries so a fresh boot can run.
 * Production callers must never use this.
 */
export function __resetRegistriesForTests(): void {
  reset(serverRegistry);
  reset(clientRegistry);
}

function reset(registry: ModuleRegistry): void {
  // We cannot mutate the registry's internals, so we replace the instance by
  // recreating it. To keep singleton identity, we mutate it by re-assigning
  // private fields via Object.assign with a fresh registry's prototype state.
  // The simplest portable approach is to swap the contents of the instance.
  const fresh = new ModuleRegistry();
  copyState(fresh, registry);
}

function copyState(from: ModuleRegistry, to: ModuleRegistry): void {
  // Replace all enumerable own properties on `to` with `from`'s.
  // This works because both instances share the same shape.
  const fromAny = from as unknown as Record<string, unknown>;
  const toAny = to as unknown as Record<string, unknown>;
  for (const key of Object.keys(toAny)) {
    delete toAny[key];
  }
  for (const key of Object.keys(fromAny)) {
    toAny[key] = fromAny[key];
  }
}
