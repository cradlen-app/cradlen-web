import { describe, expect, it } from "vitest";
import type { UserProfile } from "@/common/types/user.types";
import {
  canDriveClinicalVisit,
  canPracticeSpecialty,
  specialtyMatchesOrg,
} from "./permissions";

/** Minimal profile: role names + clinical job functions are all the predicate reads. */
function profile(opts: {
  roles?: string[];
  jobFunctions?: { code: string; is_clinical: boolean }[];
}): UserProfile {
  const roleName = (opts.roles ?? ["STAFF"])[0];
  return {
    role: { id: roleName, name: roleName },
    job_function: (opts.jobFunctions ?? [])[0] ?? null,
  } as unknown as UserProfile;
}

const owner = profile({ roles: ["OWNER"] });
const branchManager = profile({ roles: ["BRANCH_MANAGER"] });
const doctor = profile({
  roles: ["STAFF"],
  jobFunctions: [{ code: "DOCTOR", is_clinical: true }],
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

/** Build a profile carrying staff + org specialties in either code-object or string form. */
function specialtyProfile(opts: {
  staff?: (string | { code: string })[];
  org?: (string | { code: string })[];
  jobFunctions?: { code: string; is_clinical: boolean }[];
}): UserProfile {
  return {
    role: { id: "STAFF", name: "STAFF" },
    job_function: opts.jobFunctions?.[0] ?? { code: "DOCTOR", is_clinical: true },
    specialties: opts.staff,
    organization: { specialties: opts.org },
  } as unknown as UserProfile;
}

describe("specialtyMatchesOrg", () => {
  it("matches when staff and org share a specialty code", () => {
    expect(
      specialtyMatchesOrg(
        specialtyProfile({ staff: [{ code: "OBGYN" }], org: [{ code: "OBGYN" }] }),
      ),
    ).toBe(true);
  });

  it("does not match when the staff specialty is outside the org's list", () => {
    expect(
      specialtyMatchesOrg(
        specialtyProfile({
          staff: [{ code: "PEDIATRICIAN" }],
          org: [{ code: "OBGYN" }],
        }),
      ),
    ).toBe(false);
  });

  it("is case-insensitive and accepts string-form codes", () => {
    expect(
      specialtyMatchesOrg(
        specialtyProfile({ staff: ["obgyn"], org: ["OBGYN"] }),
      ),
    ).toBe(true);
  });

  it("treats an org with no published specialties as supported", () => {
    expect(
      specialtyMatchesOrg(
        specialtyProfile({ staff: [{ code: "PEDIATRICIAN" }], org: [] }),
      ),
    ).toBe(true);
  });
});

describe("canPracticeSpecialty", () => {
  it("is true for a clinician whose specialty the org supports", () => {
    expect(
      canPracticeSpecialty(
        specialtyProfile({ staff: [{ code: "OBGYN" }], org: [{ code: "OBGYN" }] }),
      ),
    ).toBe(true);
  });

  it("is false for a clinician with a mismatched specialty", () => {
    expect(
      canPracticeSpecialty(
        specialtyProfile({
          staff: [{ code: "PEDIATRICIAN" }],
          org: [{ code: "OBGYN" }],
        }),
      ),
    ).toBe(false);
  });

  it("is false for a non-clinical staff member even when specialties match", () => {
    expect(
      canPracticeSpecialty(
        specialtyProfile({
          staff: [{ code: "OBGYN" }],
          org: [{ code: "OBGYN" }],
          jobFunctions: [{ code: "RECEPTIONIST", is_clinical: false }],
        }),
      ),
    ).toBe(false);
  });
});
