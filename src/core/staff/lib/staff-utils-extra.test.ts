import { describe, expect, it } from "vitest";
import { STAFF_API_ROLE } from "@/features/auth/lib/auth.constants";
import type { ApiStaffRole } from "../types/staff.api.types";
import type { StaffMember } from "../types/staff.types";
import {
  getRoleTranslationKey,
  getStaffDisplayName,
  getStaffJobFunctionsLabel,
  getStaffSpecialtiesLabel,
  getStaffSubspecialtiesLabel,
  mapApiRoleToFilter,
  matchesStaffFilter,
} from "./staff.utils";

function member(overrides: Partial<StaffMember> = {}): StaffMember {
  return {
    id: "s-1",
    firstName: "Nour",
    lastName: "Hassan",
    handle: "@nour",
    role: STAFF_API_ROLE.STAFF,
    roleId: "r1",
    roleName: "STAFF",
    branches: [],
    jobFunction: { id: "jf-1", code: "OBGYN", name: "OB-GYN", is_clinical: true },
    specialty: { id: "sp-1", code: "CARD", name: "Cardiology" },
    subspecialties: [
      { id: "ss-1", code: "FM", name: "Fetal Medicine" },
      { id: "ss-2", code: "UR", name: "Urogynecology" },
    ],
    executiveTitle: null,
    engagementType: "FULL_TIME",
    phone: "+2012",
    status: "available",
    isClinical: true,
    ...overrides,
  } as StaffMember;
}

describe("getStaffDisplayName", () => {
  it("returns the full name when present", () => {
    expect(getStaffDisplayName(member(), "fallback")).toBe("Nour Hassan");
  });

  it("falls back to the handle (without @) when the name is blank", () => {
    expect(
      getStaffDisplayName(
        member({ firstName: "", lastName: "", handle: "@nour" }),
        "fallback",
      ),
    ).toBe("nour");
  });

  it("falls back to the provided fallback when name and handle are blank", () => {
    expect(
      getStaffDisplayName({ firstName: "", lastName: "", handle: "" }, "fallback"),
    ).toBe("fallback");
  });
});

describe("getRoleTranslationKey", () => {
  it("namespaces the role under apiRoles", () => {
    expect(getRoleTranslationKey(STAFF_API_ROLE.OWNER)).toBe(
      `apiRoles.${STAFF_API_ROLE.OWNER}`,
    );
    expect(getRoleTranslationKey("UNKNOWN")).toBe("apiRoles.UNKNOWN");
  });
});

describe("matchesStaffFilter", () => {
  it("matches everything for the 'all' filter", () => {
    expect(matchesStaffFilter(member(), "all")).toBe(true);
  });

  it("matches only the member's own role otherwise", () => {
    expect(matchesStaffFilter(member({ role: STAFF_API_ROLE.STAFF }), STAFF_API_ROLE.STAFF)).toBe(
      true,
    );
    expect(matchesStaffFilter(member({ role: STAFF_API_ROLE.STAFF }), STAFF_API_ROLE.OWNER)).toBe(
      false,
    );
  });
});

describe("mapApiRoleToFilter", () => {
  it("maps a known backend role into a normalized filter option", () => {
    const role: ApiStaffRole = { id: "r-1", name: "OWNER" };
    expect(mapApiRoleToFilter(role)).toEqual({
      id: "r-1",
      name: "OWNER",
      role: STAFF_API_ROLE.OWNER,
    });
  });

  it("normalizes an unknown backend role name to UNKNOWN", () => {
    const role: ApiStaffRole = { id: "r-2", name: "EXTERNAL" };
    expect(mapApiRoleToFilter(role).role).toBe("UNKNOWN");
  });
});

describe("label helpers", () => {
  it("getStaffJobFunctionsLabel returns the job function name or empty string", () => {
    expect(getStaffJobFunctionsLabel(member())).toBe("OB-GYN");
    expect(getStaffJobFunctionsLabel(member({ jobFunction: null }))).toBe("");
  });

  it("getStaffSpecialtiesLabel returns the specialty name or empty string", () => {
    expect(getStaffSpecialtiesLabel(member())).toBe("Cardiology");
    expect(getStaffSpecialtiesLabel(member({ specialty: null }))).toBe("");
  });

  it("getStaffSubspecialtiesLabel comma-joins subspecialty names", () => {
    expect(getStaffSubspecialtiesLabel(member())).toBe("Fetal Medicine, Urogynecology");
    expect(getStaffSubspecialtiesLabel(member({ subspecialties: [] }))).toBe("");
  });
});
