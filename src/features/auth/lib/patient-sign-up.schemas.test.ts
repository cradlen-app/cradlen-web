import { describe, expect, it } from "vitest";
import { createPatientSignUpSchema } from "./patient-sign-up.schemas";

const messages: Record<string, string> = {
  "errors.nationalIdRequired": "National ID is required",
  "errors.nationalIdInvalid": "Enter a valid 14-digit National ID",
  "errors.phoneRequired": "Phone number is required",
  "errors.invalidPhone": "Enter a valid phone number",
  "errors.dateOfBirthRequired": "Date of birth is required",
  "errors.dateOfBirthInvalid": "Enter a valid date of birth",
  "errors.securityQuestionRequired": "Please choose a security question",
  "errors.securityAnswerRequired": "Answer must be at least 2 characters",
  "errors.passwordMinLength": "Password must be at least 8 characters",
  "errors.passwordLowercase": "Password must contain a lowercase letter",
  "errors.passwordUppercase": "Password must contain an uppercase letter",
  "errors.passwordNumber": "Password must contain a number",
  "errors.passwordSymbol": "Password must contain a symbol",
  "errors.confirmPasswordRequired": "Please confirm your password",
  "errors.passwordMismatch": "Passwords do not match",
};

const t = ((key: string) => messages[key] ?? key) as Parameters<
  typeof createPatientSignUpSchema
>[0];

const VALID = {
  nationalId: "29005200101234",
  phoneNumber: "+201012345678",
  dateOfBirth: "1990-05-20",
  securityQuestion: "BIRTH_CITY",
  securityAnswer: "Cairo",
  password: "Password1!",
  confirmPassword: "Password1!",
};

describe("createPatientSignUpSchema", () => {
  it("accepts valid sign-up data with a known security question", () => {
    const result = createPatientSignUpSchema(t).safeParse(VALID);
    expect(result.success).toBe(true);
  });

  it("rejects an unknown security-question key", () => {
    const result = createPatientSignUpSchema(t).safeParse({
      ...VALID,
      securityQuestion: "NOT_A_REAL_QUESTION",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.message)).toContain(
      "Please choose a security question",
    );
  });

  it("rejects a too-short security answer", () => {
    const result = createPatientSignUpSchema(t).safeParse({
      ...VALID,
      securityAnswer: "x",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.message)).toContain(
      "Answer must be at least 2 characters",
    );
  });

  it("rejects mismatched passwords", () => {
    const result = createPatientSignUpSchema(t).safeParse({
      ...VALID,
      confirmPassword: "Different1!",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.message)).toContain(
      "Passwords do not match",
    );
  });
});
