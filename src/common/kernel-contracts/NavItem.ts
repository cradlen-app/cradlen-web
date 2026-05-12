import type { PermissionId } from "./Permission";

/**
 * Sidebar / nav item contributed by a module.
 *
 * `path` is the dashboard-relative segment (e.g. `"/staff"` or `""` for root).
 * The shell resolves the locale and org/branch prefix via `useDashboardPath`,
 * so plugins don't depend on the URL structure.
 *
 * `labelKey` is the full i18n key (e.g. `"nav.staff"` for legacy items or
 * `"staff.nav.label"` for module-owned messages). The shell calls
 * `useTranslations()` and looks up the key directly.
 *
 * `requiresPermission` is filtered by the NavRegistry at render time.
 */
export interface NavItem {
  readonly id: string;
  readonly path: string;
  readonly labelKey: string;
  readonly icon?: NavIcon;
  readonly requiresPermission?: PermissionId;
  readonly order?: number;
  /** Populated by the registry on registration. */
  readonly ownerModuleId?: string;
}

/**
 * Loosely typed icon slot so the kernel doesn't depend on `lucide-react`.
 * Modules pass their `LucideIcon` (or any forwardRef component) here.
 */
export type NavIcon = unknown;
