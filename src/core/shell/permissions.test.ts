import { describe, expect, it } from "vitest";
import type { AuthContext, AuthProfile } from "@/common/kernel-contracts";
import type { UserProfile } from "@/common/types/user.types";
import { shellPermissions } from "./permissions";

function ctx(opts: {
  roles?: string[];
  jobFunctions?: { code: string; is_clinical: boolean }[];
  staff?: { code: string }[];
  org?: { code: string }[];
}): AuthContext {
  const roleName = (opts.roles ?? ["STAFF"])[0];
  const profile = {
    role: { id: roleName, name: roleName },
    job_function: (opts.jobFunctions ?? [])[0] ?? null,
    specialty: opts.staff?.[0],
    organization: { specialties: opts.org },
  } as unknown as UserProfile;
  return {
    user: null,
    profile: profile as unknown as AuthProfile,
    orgId: null,
    branchId: null,
  };
}

const medicine = shellPermissions["medicine.read"];

describe("medicine.read", () => {
  it("shows the medicine catalogue to a specialty-matched doctor", () => {
    expect(
      medicine(
        ctx({
          jobFunctions: [{ code: "OBGYN", is_clinical: true }],
          staff: [{ code: "OBGYN" }],
          org: [{ code: "OBGYN" }],
        }),
      ),
    ).toBe(true);
  });

  it("hides it from a doctor whose specialty the org doesn't support", () => {
    expect(
      medicine(
        ctx({
          jobFunctions: [{ code: "PEDIATRICIAN", is_clinical: true }],
          staff: [{ code: "PEDIATRICIAN" }],
          org: [{ code: "OBGYN" }],
        }),
      ),
    ).toBe(false);
  });

  it("always shows it to owners", () => {
    expect(medicine(ctx({ roles: ["OWNER"] }))).toBe(true);
  });
});
