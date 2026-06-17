import { describe, expect, it } from "vitest";
import { buildSignupStartRequest } from "./signup-start";
import type { Step1Data } from "../types/sign-up.types";

const baseData: Step1Data = {
  firstName: "Sara",
  lastName: "Ali",
  email: "Sara@Example.com",
  password: "Password1!",
  confirmPassword: "Password1!",
};

describe("buildSignupStartRequest", () => {
  it("forwards date_of_birth when provided", () => {
    const payload = buildSignupStartRequest({
      ...baseData,
      dateOfBirth: "1990-05-20",
    });
    expect(payload.date_of_birth).toBe("1990-05-20");
  });

  it("omits date_of_birth when empty or absent", () => {
    expect(buildSignupStartRequest(baseData)).not.toHaveProperty(
      "date_of_birth",
    );
    expect(
      buildSignupStartRequest({ ...baseData, dateOfBirth: "" }),
    ).not.toHaveProperty("date_of_birth");
  });
});
