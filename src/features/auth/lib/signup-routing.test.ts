import { describe, it, expect } from "vitest";
import { getSignupResumePath } from "./signup-routing";
import type { RegistrationStep } from "../types/sign-up.types";

describe("getSignupResumePath", () => {
  it.each<[RegistrationStep, string]>([
    ["VERIFY_OTP", "/sign-up/verify"],
    ["COMPLETE_ONBOARDING", "/sign-up/complete"],
    ["DONE", "/sign-in"],
    ["NONE", "/sign-up"],
  ])("routes a %s registration step to %s", (step, expected) => {
    expect(getSignupResumePath(step)).toBe(expected);
  });
});
