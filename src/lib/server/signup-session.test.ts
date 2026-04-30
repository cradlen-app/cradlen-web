import { describe, expect, it } from "vitest";
import {
  extractSignupToken,
  sanitizeSignupTokenResponse,
} from "./signup-session";

describe("signup session tokens", () => {
  it("extracts signup tokens from either backend token field", () => {
    expect(
      extractSignupToken({
        data: { signup_token: "signup-token", expires_in: 600 },
      }),
    ).toBe("signup-token");
    expect(
      extractSignupToken({
        data: { registration_token: "registration-token", expires_in: 600 },
      }),
    ).toBe("registration-token");
  });

  it("removes both token field names from frontend responses", () => {
    expect(
      sanitizeSignupTokenResponse({
        data: {
          signup_token: "signup-token",
          registration_token: "registration-token",
          step: "VERIFY_OTP",
        },
        meta: {},
      }),
    ).toEqual({
      data: { step: "VERIFY_OTP" },
      meta: {},
    });
  });
});
