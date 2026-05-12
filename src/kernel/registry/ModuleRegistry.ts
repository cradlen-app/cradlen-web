import type {
  ModuleManifest,
  NavItem,
  PermissionId,
  PermissionPredicate,
  QueryKeyRoot,
} from "@/common/kernel-contracts";

import { I18nRegistry } from "./I18nRegistry";
import { NavRegistry } from "./NavRegistry";
import { PermissionRegistry } from "./PermissionRegistry";
import { QueryKeyRegistry } from "./QueryKeyRegistry";

export class RegistryFrozenError extends Error {
  constructor(action: string) {
    super(`ModuleRegistry is frozen; cannot ${action} after boot.`);
    this.name = "RegistryFrozenError";
  }
}

export class DuplicateModuleError extends Error {
  constructor(id: string) {
    super(`A module with id "${id}" is already registered.`);
    this.name = "DuplicateModuleError";
  }
}

/**
 * The single source of truth for what modules exist in this process.
 *
 * Two separate instances exist in practice (server and client); see
 * `kernel/host/bootModules.ts`. They are populated identically at boot
 * and frozen so no mutation can happen during request handling.
 */
export class ModuleRegistry {
  readonly nav: NavRegistry;
  readonly permissions: PermissionRegistry;
  readonly queryKeys: QueryKeyRegistry;
  readonly i18n: I18nRegistry;

  private readonly modules = new Map<string, ModuleManifest>();
  private frozen = false;

  constructor() {
    this.nav = new NavRegistry();
    this.permissions = new PermissionRegistry();
    this.queryKeys = new QueryKeyRegistry();
    this.i18n = new I18nRegistry();
  }

  get isFrozen(): boolean {
    return this.frozen;
  }

  register(manifest: ModuleManifest): void {
    if (this.frozen) {
      throw new RegistryFrozenError("register module");
    }
    if (this.modules.has(manifest.id)) {
      throw new DuplicateModuleError(manifest.id);
    }
    this.modules.set(manifest.id, manifest);
    this.nav.addAll(manifest.nav, manifest.id);
    for (const [permissionId, predicate] of Object.entries(manifest.permissions)) {
      this.permissions.register(permissionId as PermissionId, predicate as PermissionPredicate);
    }
    this.queryKeys.register(manifest.queryKeyRoot as QueryKeyRoot, manifest.id);
    this.i18n.register(manifest.i18nNamespace, manifest.loadMessages);
  }

  /**
   * Append nav items that don't belong to any registered module yet
   * (used during incremental migration for the legacy sidebar entries).
   */
  registerLegacyNav(items: readonly NavItem[]): void {
    if (this.frozen) {
      throw new RegistryFrozenError("register legacy nav");
    }
    this.nav.addAll(items, "__legacy__");
  }

  freeze(): void {
    this.frozen = true;
  }

  get(id: string): ModuleManifest | undefined {
    return this.modules.get(id);
  }

  has(id: string): boolean {
    return this.modules.has(id);
  }

  list(): readonly ModuleManifest[] {
    return Array.from(this.modules.values());
  }
}
