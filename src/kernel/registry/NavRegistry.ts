import type { AuthContext, NavItem } from "@/common/kernel-contracts";

import type { PermissionRegistry } from "./PermissionRegistry";

export class NavRegistry {
  private readonly items: NavItem[] = [];

  addAll(items: readonly NavItem[], ownerModuleId: string): void {
    for (const item of items) {
      this.items.push({ ...item, ownerModuleId: item.ownerModuleId ?? ownerModuleId });
    }
  }

  /** All items in registration order (no permission filter applied). */
  list(): readonly NavItem[] {
    return [...this.items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
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
