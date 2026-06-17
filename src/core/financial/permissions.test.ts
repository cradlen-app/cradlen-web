import { describe, expect, it } from "vitest";
import type { UserProfile } from "@/common/types/user.types";
import { financialCan } from "./permissions";

function profile(opts: {
  roles?: string[];
  jobFunctions?: { code: string; is_clinical: boolean }[];
  staff?: { code: string }[];
  org?: { code: string }[];
}): UserProfile {
  const roleName = (opts.roles ?? ["STAFF"])[0];
  return {
    role: { id: roleName, name: roleName },
    job_function: (opts.jobFunctions ?? [])[0] ?? null,
    specialty: opts.staff?.[0],
    organization: { specialties: opts.org },
  } as unknown as UserProfile;
}

const owner = profile({ roles: ["OWNER"] });
const branchManager = profile({ roles: ["BRANCH_MANAGER"] });
const matchedDoctor = profile({
  jobFunctions: [{ code: "OBGYN", is_clinical: true }],
  staff: [{ code: "OBGYN" }],
  org: [{ code: "OBGYN" }],
});
const mismatchedDoctor = profile({
  jobFunctions: [{ code: "PEDIATRICIAN", is_clinical: true }],
  staff: [{ code: "PEDIATRICIAN" }],
  org: [{ code: "OBGYN" }],
});

describe("financialCan.viewReportsNav", () => {
  it("includes owners and branch managers (org-wide dashboard)", () => {
    expect(financialCan.viewReportsNav(owner)).toBe(true);
    expect(financialCan.viewReportsNav(branchManager)).toBe(true);
  });

  it("includes a matched-specialty doctor (own-revenue view)", () => {
    expect(financialCan.viewReportsNav(matchedDoctor)).toBe(true);
  });

  it("excludes a mismatched-specialty doctor", () => {
    expect(financialCan.viewReportsNav(mismatchedDoctor)).toBe(false);
  });
});

describe("financialCan.viewReports (org-wide only)", () => {
  it("stays restricted to owners and branch managers", () => {
    expect(financialCan.viewReports(owner)).toBe(true);
    expect(financialCan.viewReports(matchedDoctor)).toBe(false);
  });
});
