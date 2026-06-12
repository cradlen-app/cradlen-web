import type { AuthContext, NavItem } from "@/common/kernel-contracts";

import type { PermissionRegistry } from "./PermissionRegistry";

export class NavRegistry {
  private readonly items: NavItem[] = [];

  addAll(items: readonly NavItem[], ownerModuleId: string): void {
    for (const item of items) {
      this.items.push({ ...item, ownerModuleId: item.ownerModuleId ?? ownerModuleId });
    }
  }

  /**
   * All items in display order (no permission filter applied).
   *
   * Grouped items sort by their group's order first, then by their own order
   * within the group — so e.g. a "Financial" group (`group.order: 45`) clusters
   * between Patients (40) and Staff (50) with its children kept in sequence.
   * Ungrouped items sort by their own order.
   */
  list(): readonly NavItem[] {
    return [...this.items].sort((a, b) => {
      const ao = a.group?.order ?? a.order ?? 0;
      const bo = b.group?.order ?? b.order ?? 0;
      return ao !== bo ? ao - bo : (a.order ?? 0) - (b.order ?? 0);
    });
  }

  /**
   * The most specific nav item whose dashboard-relative `path` owns the given
   * path — an exact match, or a parent prefix (e.g. `/financial/invoices` owns
   * `/financial/invoices/inv-1`). Root items (`path === ""`) are skipped because
   * they would otherwise prefix-match every route. Used by the route guard to
   * resolve a URL to the permission that gates it. Returns `undefined` if no
   * item matches.
   */
  matchByPath(relativePath: string): NavItem | undefined {
    let match: NavItem | undefined;
    for (const item of this.items) {
      if (!item.path) continue;
      if (relativePath === item.path || relativePath.startsWith(item.path + "/")) {
        if (!match || item.path.length > match.path.length) match = item;
      }
    }
    return match;
  }

  /**
   * Items the given auth context is allowed to see.
   * An item with no `requiresPermission` is always visible.
   */
  visibleFor(ctx: AuthContext, permissions: PermissionRegistry): readonly NavItem[] {
    return this.list().filter((item) => {
      if (!item.requiresPermission) return true;
      return permissions.check(item.requiresPermission, ctx);
    });
  }
}
