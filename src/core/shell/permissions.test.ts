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
const dashboardHome = shellPermissions["dashboard.home"];
const operations = shellPermissions["operations.view"];
const clinicalWorkspace = shellPermissions["clinicalWorkspace.view"];
const medicalRep = shellPermissions["medicalRep.view"];

describe("operations.view (patients table)", () => {
  it("hides the patients table from the back-office accountant", () => {
    expect(
      operations(ctx({ jobFunctions: [{ code: "ACCOUNTANT", is_clinical: false }] })),
    ).toBe(false);
  });

  it("shows it to a receptionist", () => {
    expect(
      operations(ctx({ jobFunctions: [{ code: "RECEPTIONIST", is_clinical: false }] })),
    ).toBe(true);
  });

  it("shows it to owners and branch managers (incl. non-doctor managers)", () => {
    expect(operations(ctx({ roles: ["OWNER"] }))).toBe(true);
    expect(operations(ctx({ roles: ["BRANCH_MANAGER"] }))).toBe(true);
  });
});

describe("clinicalWorkspace.view (visits + calendar)", () => {
  it("excludes a non-doctor branch manager", () => {
    expect(clinicalWorkspace(ctx({ roles: ["BRANCH_MANAGER"] }))).toBe(false);
  });

  it("includes a doctor branch manager (via clinical job function)", () => {
    expect(
      clinicalWorkspace(
        ctx({
          roles: ["BRANCH_MANAGER"],
          jobFunctions: [{ code: "DOCTOR", is_clinical: true }],
        }),
      ),
    ).toBe(true);
  });

  it("includes receptionists and clinical staff", () => {
    expect(
      clinicalWorkspace(ctx({ jobFunctions: [{ code: "RECEPTIONIST", is_clinical: false }] })),
    ).toBe(true);
    expect(
      clinicalWorkspace(ctx({ jobFunctions: [{ code: "OBGYN", is_clinical: true }] })),
    ).toBe(true);
  });

  it("excludes a non-clinical owner but includes a doctor owner", () => {
    expect(clinicalWorkspace(ctx({ roles: ["OWNER"] }))).toBe(false);
    expect(
      clinicalWorkspace(
        ctx({
          roles: ["OWNER"],
          jobFunctions: [{ code: "DOCTOR", is_clinical: true }],
        }),
      ),
    ).toBe(true);
  });

  it("excludes the accountant", () => {
    expect(
      clinicalWorkspace(ctx({ jobFunctions: [{ code: "ACCOUNTANT", is_clinical: false }] })),
    ).toBe(false);
  });
});

describe("dashboard.home", () => {
  it("hides the dashboard home from the accountant", () => {
    expect(
      dashboardHome(ctx({ jobFunctions: [{ code: "ACCOUNTANT", is_clinical: false }] })),
    ).toBe(false);
  });

  it("hides it from the receptionist but shows it to owners", () => {
    expect(
      dashboardHome(ctx({ jobFunctions: [{ code: "RECEPTIONIST", is_clinical: false }] })),
    ).toBe(false);
    expect(dashboardHome(ctx({ roles: ["OWNER"] }))).toBe(true);
  });
});

describe("medicalRep.view", () => {
  it("shows the medical-rep overview to owners and branch managers", () => {
    expect(medicalRep(ctx({ roles: ["OWNER"] }))).toBe(true);
    expect(medicalRep(ctx({ roles: ["BRANCH_MANAGER"] }))).toBe(true);
  });

  it("shows it to a doctor (scoped to their own reps server-side)", () => {
    expect(
      medicalRep(ctx({ jobFunctions: [{ code: "DOCTOR", is_clinical: true }] })),
    ).toBe(true);
  });

  it("hides it from the accountant and receptionist", () => {
    expect(
      medicalRep(ctx({ jobFunctions: [{ code: "ACCOUNTANT", is_clinical: false }] })),
    ).toBe(false);
    expect(
      medicalRep(ctx({ jobFunctions: [{ code: "RECEPTIONIST", is_clinical: false }] })),
    ).toBe(false);
  });
});

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
