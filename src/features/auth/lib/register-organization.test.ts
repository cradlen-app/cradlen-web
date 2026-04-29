import { describe, expect, it } from "vitest";
import type { Step1Data, Step3Data } from "../types/sign-up.types";
import { buildRegisterOrganizationRequest } from "./register-organization";
import { step1Schema, step3Schema } from "./sign-up.schemas";
import { buildSignupStartRequest } from "./signup-start";

const baseStep1Data: Step1Data = {
  firstName: "Jane",
  lastName: "Doe",
  phoneNumber: "",
  email: "jane@example.com",
  password: "Password1!",
  confirmPassword: "Password1!",
};

const baseStep3Data: Step3Data = {
  accountName: "Test Clinic",
  specialties: "Cardiology, Pediatrics",
  city: "Cairo",
  address: "123 Main St",
  governorate: "Cairo",
  country: "Egypt",
  role: "owner",
};

describe("step1Schema", () => {
  it("accepts valid personal information with an empty optional phone", () => {
    expect(step1Schema.safeParse(baseStep1Data).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = step1Schema.safeParse({
      ...baseStep1Data,
      email: "not-an-email",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ["email"] }),
        ]),
      );
    }
  });

  it("keeps the existing password strength rules", () => {
    const result = step1Schema.safeParse({
      ...baseStep1Data,
      password: "short",
      confirmPassword: "short",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ["password"] }),
        ]),
      );
    }
  });

  it("rejects mismatched password confirmation", () => {
    const result = step1Schema.safeParse({
      ...baseStep1Data,
      confirmPassword: "Different1!",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ["confirmPassword"] }),
        ]),
      );
    }
  });

  it("accepts Egyptian and generic international phone numbers", () => {
    expect(
      step1Schema.safeParse({
        ...baseStep1Data,
        phoneNumber: "0100 000 0000",
      }).success,
    ).toBe(true);
    expect(
      step1Schema.safeParse({
        ...baseStep1Data,
        phoneNumber: "+44 20 7946 0958",
      }).success,
    ).toBe(true);
  });

  it("rejects malformed phone numbers", () => {
    const result = step1Schema.safeParse({
      ...baseStep1Data,
      phoneNumber: "123",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ["phoneNumber"] }),
        ]),
      );
    }
  });
});

describe("step3Schema", () => {
  it("accepts required account setup fields", () => {
    expect(step3Schema.safeParse(baseStep3Data).success).toBe(true);
  });

  it("requires a role", () => {
    const result = step3Schema.safeParse({
      ...baseStep3Data,
      role: "" as Step3Data["role"],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ["role"] }),
        ]),
      );
    }
  });
});

describe("buildSignupStartRequest", () => {
  it("maps personal info to the signup start payload", () => {
    expect(buildSignupStartRequest(baseStep1Data)).toEqual({
      first_name: "Jane",
      last_name: "Doe",
      email: "jane@example.com",
      password: "Password1!",
      confirm_password: "Password1!",
    });
  });

  it("normalizes Egyptian local phone numbers", () => {
    expect(
      buildSignupStartRequest({
        ...baseStep1Data,
        phoneNumber: "0100 000 0000",
      }),
    ).toEqual(
      expect.objectContaining({
        phone_number: "+201000000000",
      }),
    );
  });

  it("normalizes Egyptian numbers with 0020 prefix", () => {
    expect(
      buildSignupStartRequest({
        ...baseStep1Data,
        phoneNumber: "0020 100 000 0000",
      }),
    ).toEqual(
      expect.objectContaining({
        phone_number: "+201000000000",
      }),
    );
  });

  it("normalizes formatted international phone numbers", () => {
    expect(
      buildSignupStartRequest({
        ...baseStep1Data,
        phoneNumber: "+44 (20) 7946-0958",
      }),
    ).toEqual(
      expect.objectContaining({
        phone_number: "+442079460958",
      }),
    );
  });
});

describe("buildRegisterOrganizationRequest", () => {
  it("maps owner doctor to the signup complete payload", () => {
    expect(
      buildRegisterOrganizationRequest("test@example.com", {
        ...baseStep3Data,
        role: "owner_doctor",
        specialty: "Pediatrics",
        jobTitle: "Senior Physician",
      }),
    ).toEqual({
      email: "test@example.com",
      account_name: "Test Clinic",
      account_specialities: ["Cardiology", "Pediatrics"],
      branch_name: "Test Clinic",
      branch_address: "123 Main St",
      branch_city: "Cairo",
      branch_governorate: "Cairo",
      branch_country: "Egypt",
      roles: ["OWNER", "DOCTOR"],
      is_clinical: true,
      specialty: "Pediatrics",
      job_title: "Senior Physician",
    });
  });

  it("maps owner to a non-clinical signup complete payload", () => {
    expect(buildRegisterOrganizationRequest("test@example.com", baseStep3Data))
      .toEqual({
        email: "test@example.com",
        account_name: "Test Clinic",
        account_specialities: ["Cardiology", "Pediatrics"],
        branch_name: "Test Clinic",
        branch_address: "123 Main St",
        branch_city: "Cairo",
        branch_governorate: "Cairo",
        branch_country: "Egypt",
        roles: ["OWNER"],
        is_clinical: false,
      });
  });

  it("omits empty doctor optional fields", () => {
    expect(
      buildRegisterOrganizationRequest("test@example.com", {
        ...baseStep3Data,
        role: "owner_doctor",
        specialty: " ",
        jobTitle: "",
      }),
    ).toEqual({
      email: "test@example.com",
      account_name: "Test Clinic",
      account_specialities: ["Cardiology", "Pediatrics"],
      branch_name: "Test Clinic",
      branch_address: "123 Main St",
      branch_city: "Cairo",
      branch_governorate: "Cairo",
      branch_country: "Egypt",
      roles: ["OWNER", "DOCTOR"],
      is_clinical: true,
    });
  });
});
