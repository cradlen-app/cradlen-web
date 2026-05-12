import { describe, expect, it } from "vitest";

import type { AuthContext, NavItem } from "@/common/kernel-contracts";

import { NavRegistry } from "./NavRegistry";
import { PermissionRegistry } from "./PermissionRegistry";

const owner: AuthContext = {
  user: { id: "u1" },
  profile: { id: "p1", role: "owner" },
  orgId: "o1",
  branchId: "b1",
};
const reception: AuthContext = {
  user: { id: "u2" },
  profile: { id: "p2", role: "reception" },
  orgId: "o1",
  branchId: "b1",
};


function item(over: Partial<NavItem>): NavItem {
  return { id: "x", labelKey: "k", path: "/", ...over };
}

describe("NavRegistry", () => {
  it("sorts by order ascending", () => {
    const reg = new NavRegistry();
    reg.addAll(
      [item({ id: "b", order: 2 }), item({ id: "a", order: 1 }), item({ id: "c" })],
      "mod",
    );
    expect(reg.list().map((i) => i.id)).toEqual(["c", "a", "b"]);
  });

  it("filters items by requiresPermission", () => {
    const nav = new NavRegistry();
    const permissions = new PermissionRegistry();
    permissions.register("staff.read", (ctx) =>
      ["owner", "doctor"].includes((ctx.profile?.role as string | undefined) ?? ""),
    );
    nav.addAll(
      [
        item({ id: "always", labelKey: "n.always" }),
        item({ id: "staff", labelKey: "n.staff", requiresPermission: "staff.read" }),
      ],
      "core",
    );

    expect(nav.visibleFor(owner, permissions).map((i) => i.id)).toEqual([
      "always",
      "staff",
    ]);
    expect(nav.visibleFor(reception, permissions).map((i) => i.id)).toEqual([
      "always",
    ]);
  });

  it("treats unknown permission ids as denied", () => {
    const nav = new NavRegistry();
    const permissions = new PermissionRegistry();
    nav.addAll([item({ id: "ghost", requiresPermission: "does.not.exist" })], "core");
    expect(nav.visibleFor(owner, permissions)).toEqual([]);
  });
});
