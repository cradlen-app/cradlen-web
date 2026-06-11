import { describe, expect, it } from "vitest";
import type { UserProfile } from "@/common/types/user.types";
import { canDriveClinicalVisit } from "./permissions";

/** Minimal profile: role names + clinical job functions are all the predicate reads. */
function profile(opts: {
  roles?: string[];
  jobFunctions?: { code: string; is_clinical: boolean }[];
}): UserProfile {
  return {
    roles: (opts.roles ?? []).map((name) => ({ id: name, name })),
    job_functions: opts.jobFunctions ?? [],
  } as unknown as UserProfile;
}

const owner = profile({ roles: ["OWNER"] });
const branchManager = profile({ roles: ["BRANCH_MANAGER"] });
const doctor = profile({
  roles: ["STAFF"],
  jobFunctions: [{ code: "OTHER_DOCTOR", is_clinical: true }],
});
const receptionist = profile({
  roles: ["STAFF"],
  jobFunctions: [{ code: "RECEPTIONIST", is_clinical: false }],
});

describe("canDriveClinicalVisit", () => {
  it("lets the assigned doctor drive their own visit", () => {
    expect(canDriveClinicalVisit(doctor, "doc-1", "doc-1")).toBe(true);
  });

  it("blocks a clinician who is not the assigned doctor", () => {
    expect(canDriveClinicalVisit(doctor, "doc-1", "doc-2")).toBe(false);
  });

  it("blocks a receptionist even when ids happen to match", () => {
    expect(canDriveClinicalVisit(receptionist, "rec-1", "rec-1")).toBe(false);
  });

  it("blocks a clinician when the visit has no assigned doctor", () => {
    expect(canDriveClinicalVisit(doctor, undefined, "doc-1")).toBe(false);
  });

  it("allows owners and branch managers as an administrative override", () => {
    expect(canDriveClinicalVisit(owner, "someone-else", "owner-1")).toBe(true);
    expect(canDriveClinicalVisit(branchManager, undefined, "mgr-1")).toBe(true);
  });

  it("blocks an undefined profile", () => {
    expect(canDriveClinicalVisit(undefined, "doc-1", "doc-1")).toBe(false);
  });
});
