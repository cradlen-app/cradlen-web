import { describe, expect, it } from "vitest";
import type { AuthContext, AuthProfile, Persona } from "@/common/kernel-contracts";
import {
  PERMISSIONS,
  PERMISSION_MATRIX,
  PERSONAS,
} from "@/common/kernel-contracts";
import type { UserProfile } from "@/common/types/user.types";
import { bootModules } from "@/kernel";

/**
 * Parity guardrail. The kernel-aggregated permission registry (shell + staff +
 * financial predicates) must reproduce the canonical `PERMISSION_MATRIX` for
 * every persona × permission cell. If a predicate changes without the matrix
 * (or vice versa), this fails — that is the drift alarm. The same matrix is
 * mirrored in `cradlen-api`, so both repos prove conformance to one table.
 */

/** Build a `UserProfile` for a persona. Clinical personas are specialty-matched. */
function profile(opts: {
  role: string;
  jobFunction?: { code: string; is_clinical: boolean };
  clinical?: boolean;
}): UserProfile {
  return {
    role: { id: opts.role, name: opts.role },
    job_function: opts.jobFunction ?? null,
    // A matched specialty so `canPracticeSpecialty` is true for clinicians.
    specialty: opts.clinical ? { code: "OBGYN" } : undefined,
    organization: { specialties: [{ code: "OBGYN" }] },
  } as unknown as UserProfile;
}

const DOCTOR_JF = { code: "DOCTOR", is_clinical: true };

const personaProfiles: Record<Persona, UserProfile> = {
  ownerDoctor: profile({ role: "OWNER", jobFunction: DOCTOR_JF, clinical: true }),
  ownerNonDoctor: profile({ role: "OWNER" }),
  branchManagerDoctor: profile({
    role: "BRANCH_MANAGER",
    jobFunction: DOCTOR_JF,
    clinical: true,
  }),
  branchManagerNonDoctor: profile({ role: "BRANCH_MANAGER" }),
  doctor: profile({ role: "STAFF", jobFunction: DOCTOR_JF, clinical: true }),
  receptionist: profile({
    role: "STAFF",
    jobFunction: { code: "RECEPTIONIST", is_clinical: false },
  }),
  accountant: profile({
    role: "STAFF",
    jobFunction: { code: "ACCOUNTANT", is_clinical: false },
  }),
};

function ctx(persona: Persona): AuthContext {
  return {
    user: null,
    profile: personaProfiles[persona] as unknown as AuthProfile,
    orgId: null,
    branchId: null,
  };
}

const registry = bootModules();
const catalogIds = Object.values(PERMISSIONS);

describe("permission matrix parity", () => {
  for (const id of catalogIds) {
    for (const persona of PERSONAS) {
      const expected = PERMISSION_MATRIX[id][persona];
      it(`${id} for ${persona} → ${expected}`, () => {
        expect(registry.permissions.check(id, ctx(persona))).toBe(expected);
      });
    }
  }
});

describe("permission catalog completeness", () => {
  it("every catalog id has a registered predicate", () => {
    for (const id of catalogIds) {
      expect(registry.permissions.has(id)).toBe(true);
    }
  });

  it("the matrix covers exactly the catalog ids", () => {
    expect(Object.keys(PERMISSION_MATRIX).sort()).toEqual(
      [...catalogIds].sort(),
    );
  });

  it("every nav requiresPermission id is a known catalog id", () => {
    const knownIds = new Set<string>(catalogIds);
    for (const item of registry.nav.list()) {
      if (item.requiresPermission) {
        expect(knownIds.has(item.requiresPermission)).toBe(true);
      }
    }
  });
});
