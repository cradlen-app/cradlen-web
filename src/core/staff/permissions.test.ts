import { describe, expect, it } from "vitest";
import { PERMISSIONS } from "@/common/kernel-contracts";
import type { UserProfile } from "@/common/types/user.types";
import { staffCan, staffPermissions } from "./permissions";

function profile(p: Record<string, unknown>): UserProfile {
  return p as unknown as UserProfile;
}

const owner = profile({ role: { name: "OWNER" } });
const branchManager = profile({ role: "BRANCH_MANAGER" });
const receptionByJob = profile({ job_function: { code: "RECEPTIONIST" } });
const receptionByRole = profile({ role: { name: "reception" } });
const plainStaff = profile({ role: { name: "STAFF" } });

describe("staffCan helpers", () => {
  it("owner can do everything", () => {
    expect(staffCan.read(owner)).toBe(true);
    expect(staffCan.manage(owner)).toBe(true);
    expect(staffCan.editRoles(owner)).toBe(true);
    expect(staffCan.delete(owner)).toBe(true);
  });

  it("branch manager can read + manage but not edit roles or delete", () => {
    expect(staffCan.read(branchManager)).toBe(true);
    expect(staffCan.manage(branchManager)).toBe(true);
    expect(staffCan.editRoles(branchManager)).toBe(false);
    expect(staffCan.delete(branchManager)).toBe(false);
  });

  it("receptionist (by job function or by RECEPTION role) can read only", () => {
    for (const p of [receptionByJob, receptionByRole]) {
      expect(staffCan.read(p)).toBe(true);
      expect(staffCan.manage(p)).toBe(false);
      expect(staffCan.editRoles(p)).toBe(false);
    }
  });

  it("plain staff and null profiles have no access", () => {
    for (const p of [plainStaff, null, undefined]) {
      expect(staffCan.read(p)).toBe(false);
      expect(staffCan.manage(p)).toBe(false);
      expect(staffCan.editRoles(p)).toBe(false);
      expect(staffCan.delete(p)).toBe(false);
    }
  });
});

describe("staffPermissions kernel predicates", () => {
  it("adapt the pure helpers by reading ctx.profile", () => {
    const ctx = { profile: owner } as never;
    expect(staffPermissions[PERMISSIONS.staffRead](ctx)).toBe(true);
    expect(staffPermissions[PERMISSIONS.staffManage](ctx)).toBe(true);
    expect(staffPermissions[PERMISSIONS.staffEditRoles](ctx)).toBe(true);
    expect(staffPermissions[PERMISSIONS.staffDelete](ctx)).toBe(true);
  });

  it("deny a receptionist manage/delete via the kernel map", () => {
    const ctx = { profile: receptionByJob } as never;
    expect(staffPermissions[PERMISSIONS.staffRead](ctx)).toBe(true);
    expect(staffPermissions[PERMISSIONS.staffManage](ctx)).toBe(false);
    expect(staffPermissions[PERMISSIONS.staffDelete](ctx)).toBe(false);
  });
});
