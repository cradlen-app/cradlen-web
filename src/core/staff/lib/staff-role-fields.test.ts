import { describe, expect, it } from "vitest";
import {
  buildStaffRoleFields,
  deriveJobRoleFromMember,
} from "./staff-role-fields";
import type { StaffMember } from "../types/staff.types";

describe("buildStaffRoleFields", () => {
  it("clears both arrays for None", () => {
    expect(
      buildStaffRoleFields({ jobRole: "NONE", doctorSpecialty: "" }),
    ).toEqual({ job_function_codes: [], specialty_codes: [] });
  });

  it("maps a doctor's specialty to its clinical code and keeps the title", () => {
    expect(
      buildStaffRoleFields({
        jobRole: "DOCTOR",
        doctorSpecialty: "OBGYN",
        professionalTitle: "  استشاري النساء والتوليد  ",
      }),
    ).toEqual({
      job_function_codes: ["OBGYN"],
      specialty_codes: ["OBGYN"],
      professional_title: "استشاري النساء والتوليد",
    });
  });

  it("falls back to OTHER_DOCTOR for a non-doctor specialty code", () => {
    const result = buildStaffRoleFields({
      jobRole: "DOCTOR",
      doctorSpecialty: "CARDIOLOGY",
    });
    expect(result.job_function_codes).toEqual(["OTHER_DOCTOR"]);
    expect(result.specialty_codes).toEqual(["CARDIOLOGY"]);
    expect(result).not.toHaveProperty("professional_title");
  });

  it("maps Receptionist and Accountant to a single job-function code", () => {
    expect(
      buildStaffRoleFields({ jobRole: "RECEPTIONIST", doctorSpecialty: "" })
        .job_function_codes,
    ).toEqual(["RECEPTIONIST"]);
    expect(
      buildStaffRoleFields({ jobRole: "ACCOUNTANT", doctorSpecialty: "" })
        .job_function_codes,
    ).toEqual(["ACCOUNTANT"]);
  });

  it("omits codes for a doctor with no specialty chosen yet", () => {
    expect(
      buildStaffRoleFields({ jobRole: "DOCTOR", doctorSpecialty: "" }),
    ).toEqual({ job_function_codes: [], specialty_codes: [] });
  });
});

function makeMember(overrides: Partial<StaffMember>): StaffMember {
  return {
    id: "1",
    firstName: "A",
    lastName: "B",
    handle: "@ab",
    phone: "-",
    status: "available",
    role: "STAFF",
    roles: [],
    branches: [],
    jobFunctions: [],
    specialties: [],
    isClinical: false,
    ...overrides,
  };
}

describe("deriveJobRoleFromMember", () => {
  it("derives DOCTOR + specialty + title from a doctor member", () => {
    const member = makeMember({
      jobFunctions: [{ id: "j", code: "OBGYN", name: "OB/GYN", is_clinical: true }],
      specialties: [{ id: "s", code: "OBGYN", name: "OB/GYN" }],
      professionalTitle: "Consultant",
    });
    expect(deriveJobRoleFromMember(member)).toEqual({
      jobRole: "DOCTOR",
      doctorSpecialty: "OBGYN",
      professionalTitle: "Consultant",
    });
  });

  it("derives RECEPTIONIST / ACCOUNTANT", () => {
    expect(
      deriveJobRoleFromMember(
        makeMember({
          jobFunctions: [
            { id: "j", code: "RECEPTIONIST", name: "Receptionist", is_clinical: false },
          ],
        }),
      ).jobRole,
    ).toBe("RECEPTIONIST");
    expect(
      deriveJobRoleFromMember(
        makeMember({
          jobFunctions: [
            { id: "j", code: "ACCOUNTANT", name: "Accountant", is_clinical: false },
          ],
        }),
      ).jobRole,
    ).toBe("ACCOUNTANT");
  });

  it("maps legacy NURSE / ASSISTANT and empty to NONE", () => {
    expect(
      deriveJobRoleFromMember(
        makeMember({
          jobFunctions: [{ id: "j", code: "NURSE", name: "Nurse", is_clinical: true }],
        }),
      ).jobRole,
    ).toBe("NONE");
    expect(deriveJobRoleFromMember(makeMember({})).jobRole).toBe("NONE");
  });
});
