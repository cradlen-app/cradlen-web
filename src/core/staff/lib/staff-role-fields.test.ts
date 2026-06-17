import { describe, expect, it } from "vitest";
import {
  buildStaffRoleFields,
  deriveJobRoleFromMember,
} from "./staff-role-fields";
import type { StaffMember } from "../types/staff.types";

describe("buildStaffRoleFields", () => {
  it("clears the job function for None", () => {
    expect(
      buildStaffRoleFields({
        jobRole: "NONE",
        doctorSpecialty: "",
        doctorSubspecialties: [],
      }),
    ).toEqual({
      job_function_code: null,
      specialty_code: null,
      subspecialty_codes: [],
    });
  });

  it("maps a doctor to the DOCTOR job function + chosen specialty + subspecialties and keeps the title", () => {
    expect(
      buildStaffRoleFields({
        jobRole: "DOCTOR",
        doctorSpecialty: "OBGYN",
        doctorSubspecialties: ["REI"],
        professionalTitle: "  استشاري النساء والتوليد  ",
      }),
    ).toEqual({
      job_function_code: "DOCTOR",
      specialty_code: "OBGYN",
      subspecialty_codes: ["REI"],
      professional_title: "استشاري النساء والتوليد",
    });
  });

  it("stores the coarse DOCTOR job function regardless of specialty", () => {
    const result = buildStaffRoleFields({
      jobRole: "DOCTOR",
      doctorSpecialty: "CARDIOLOGY",
      doctorSubspecialties: [],
    });
    expect(result.job_function_code).toBe("DOCTOR");
    expect(result.specialty_code).toBe("CARDIOLOGY");
    expect(result.subspecialty_codes).toEqual([]);
    expect(result).not.toHaveProperty("professional_title");
  });

  it("maps Receptionist and Accountant to a single job-function code", () => {
    expect(
      buildStaffRoleFields({
        jobRole: "RECEPTIONIST",
        doctorSpecialty: "",
        doctorSubspecialties: [],
      }).job_function_code,
    ).toBe("RECEPTIONIST");
    expect(
      buildStaffRoleFields({
        jobRole: "ACCOUNTANT",
        doctorSpecialty: "",
        doctorSubspecialties: [],
      }).job_function_code,
    ).toBe("ACCOUNTANT");
  });

  it("clears the job function for a doctor with no specialty chosen yet", () => {
    expect(
      buildStaffRoleFields({
        jobRole: "DOCTOR",
        doctorSpecialty: "",
        doctorSubspecialties: [],
      }),
    ).toEqual({
      job_function_code: null,
      specialty_code: null,
      subspecialty_codes: [],
    });
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
    roleId: "r-staff",
    roleName: "STAFF",
    branches: [],
    jobFunction: null,
    specialty: null,
    subspecialties: [],
    isClinical: false,
    ...overrides,
  };
}

describe("deriveJobRoleFromMember", () => {
  it("derives DOCTOR + specialty + title from a doctor member", () => {
    const member = makeMember({
      jobFunction: { id: "j", code: "DOCTOR", name: "Doctor", is_clinical: true },
      specialty: { id: "s", code: "OBGYN", name: "OB/GYN" },
      subspecialties: [
        { id: "ss", code: "REI", name: "Infertility", specialty_code: "OBGYN" },
      ],
      professionalTitle: "Consultant",
    });
    expect(deriveJobRoleFromMember(member)).toEqual({
      jobRole: "DOCTOR",
      doctorSpecialty: "OBGYN",
      doctorSubspecialties: ["REI"],
      professionalTitle: "Consultant",
    });
  });

  it("derives RECEPTIONIST / ACCOUNTANT", () => {
    expect(
      deriveJobRoleFromMember(
        makeMember({
          jobFunction: {
            id: "j",
            code: "RECEPTIONIST",
            name: "Receptionist",
            is_clinical: false,
          },
        }),
      ).jobRole,
    ).toBe("RECEPTIONIST");
    expect(
      deriveJobRoleFromMember(
        makeMember({
          jobFunction: {
            id: "j",
            code: "ACCOUNTANT",
            name: "Accountant",
            is_clinical: false,
          },
        }),
      ).jobRole,
    ).toBe("ACCOUNTANT");
  });

  it("maps legacy NURSE / ASSISTANT and empty to NONE", () => {
    expect(
      deriveJobRoleFromMember(
        makeMember({
          jobFunction: { id: "j", code: "NURSE", name: "Nurse", is_clinical: true },
        }),
      ).jobRole,
    ).toBe("NONE");
    expect(deriveJobRoleFromMember(makeMember({})).jobRole).toBe("NONE");
  });
});
