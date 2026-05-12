import { describe, expect, it } from "vitest";

import type { AuthContext } from "@/common/kernel-contracts";

import {
  DuplicatePermissionError,
  PermissionRegistry,
} from "./PermissionRegistry";

const ctx: AuthContext = {
  user: { id: "u" },
  profile: { id: "p", role: "owner" },
  orgId: "o",
  branchId: "b",
};


describe("PermissionRegistry", () => {
  it("evaluates registered predicates", () => {
    const reg = new PermissionRegistry();
    reg.register("staff.read", (c) => c.profile?.role === "owner");
    expect(reg.check("staff.read", ctx)).toBe(true);
    expect(reg.check("staff.read", { ...ctx, profile: { id: "p", role: "reception" } })).toBe(false);
  });

  it("returns false for unknown ids", () => {
    const reg = new PermissionRegistry();
    expect(reg.check("missing", ctx)).toBe(false);
  });

  it("rejects duplicate ids", () => {
    const reg = new PermissionRegistry();
    reg.register("staff.read", () => true);
    expect(() => reg.register("staff.read", () => false)).toThrow(DuplicatePermissionError);
  });

  it("exposes list of registered ids", () => {
    const reg = new PermissionRegistry();
    reg.register("a", () => true);
    reg.register("b", () => false);
    expect(reg.list()).toEqual(["a", "b"]);
  });
});
