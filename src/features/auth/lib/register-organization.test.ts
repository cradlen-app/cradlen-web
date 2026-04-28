import { describe, expect, it } from "vitest";
import type { Step3Data } from "../types/sign-up.types";
import { buildRegisterOrganizationRequest } from "./register-organization";
import { step3Schema } from "./sign-up.schemas";

const baseStep3Data: Step3Data = {
  organizationName: "Test Clinic",
  specialties: "Cardiology, Pediatrics",
  city: "Cairo",
  address: "123 Main St",
  governorate: "Cairo",
  country: "Egypt",
  isClinical: false,
  specialty: "",
  jobTitle: "",
};

describe("step3Schema", () => {
  it("does not require a personal specialty for non-clinical owners", () => {
    expect(step3Schema.safeParse(baseStep3Data).success).toBe(true);
  });

  it("requires a personal specialty for clinical owners", () => {
    const result = step3Schema.safeParse({
      ...baseStep3Data,
      isClinical: true,
      specialty: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ["specialty"] }),
        ]),
      );
    }
  });
});

describe("buildRegisterOrganizationRequest", () => {
  it("maps clinical specialty to backend speciality", () => {
    expect(
      buildRegisterOrganizationRequest("registration-token", {
        ...baseStep3Data,
        isClinical: true,
        specialty: "Cardiology",
        jobTitle: "Consultant",
      }),
    ).toEqual({
      registration_token: "registration-token",
      organization_name: "Test Clinic",
      organization_specialities: ["Cardiology", "Pediatrics"],
      branch_address: "123 Main St",
      branch_city: "Cairo",
      branch_governorate: "Cairo",
      branch_country: "Egypt",
      is_clinical: true,
      speciality: "Cardiology",
      job_title: "Consultant",
    });
  });

  it("omits speciality and blank job_title when not provided", () => {
    expect(buildRegisterOrganizationRequest("registration-token", baseStep3Data))
      .toEqual({
        registration_token: "registration-token",
        organization_name: "Test Clinic",
        organization_specialities: ["Cardiology", "Pediatrics"],
        branch_address: "123 Main St",
        branch_city: "Cairo",
        branch_governorate: "Cairo",
        branch_country: "Egypt",
        is_clinical: false,
      });
  });
});
