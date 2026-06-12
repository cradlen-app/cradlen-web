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

  it("clusters grouped items by group order, then by item order within the group", () => {
    const reg = new NavRegistry();
    const financial = { id: "financial", labelKey: "f.group", order: 45 };
    reg.addAll(
      [
        item({ id: "patients", path: "/patients", order: 40 }),
        item({ id: "staff", path: "/staff", order: 50 }),
        item({ id: "reports", path: "/financial/reports", order: 4, group: financial }),
        item({ id: "services", path: "/financial/services", order: 1, group: financial }),
      ],
      "mod",
    );
    expect(reg.list().map((i) => i.id)).toEqual([
      "patients", // 40
      "services", // group 45, child 1
      "reports", // group 45, child 4
      "staff", // 50
    ]);
  });

  it("matchByPath resolves a route to its owning nav item (longest prefix wins)", () => {
    const reg = new NavRegistry();
    reg.addAll(
      [
        item({ id: "root", path: "" }),
        item({ id: "visits", path: "/visits" }),
        item({ id: "invoices", path: "/financial/invoices" }),
      ],
      "mod",
    );
    expect(reg.matchByPath("/visits")?.id).toBe("visits");
    expect(reg.matchByPath("/financial/invoices/inv-1")?.id).toBe("invoices");
    // Root items (path "") never prefix-match a child route.
    expect(reg.matchByPath("/unknown")).toBeUndefined();
    // A near-miss must not match by raw string prefix.
    expect(reg.matchByPath("/visitations")).toBeUndefined();
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
