import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api";
import {
  getProfilesFromAuthResponse,
  resolveAuthRedirect,
} from "@/lib/auth/redirect";
import { isInvalidSignInError } from "../lib/sign-in-errors";
import { getSafeRedirectPath } from "../lib/redirect";

describe("getSafeRedirectPath", () => {
  it("allows same-origin absolute paths", () => {
    expect(getSafeRedirectPath("/staff?tab=invitations")).toBe(
      "/staff?tab=invitations",
    );
  });

  it("falls back for missing or unsafe redirect paths", () => {
    expect(getSafeRedirectPath(null)).toBe("/dashboard");
    expect(getSafeRedirectPath("https://example.com")).toBe("/dashboard");
    expect(getSafeRedirectPath("//example.com")).toBe("/dashboard");
  });
});

describe("isInvalidSignInError", () => {
  it("treats rejected sign-in statuses as invalid credentials", () => {
    expect(isInvalidSignInError(new ApiError(401, "Unauthorized"))).toBe(true);
    expect(isInvalidSignInError(new ApiError(403, "Forbidden"))).toBe(true);
  });

  it("does not treat other failures as invalid credentials", () => {
    expect(isInvalidSignInError(new ApiError(500, "Server error"))).toBe(false);
    expect(isInvalidSignInError(new Error("Network error"))).toBe(false);
  });
});

describe("sign-in auth redirect responses", () => {
  it("routes onboarding-required sign-in responses", () => {
    expect(
      resolveAuthRedirect({
        data: {
          type: "ONBOARDING_REQUIRED",
          step: "VERIFY_OTP",
        },
      }),
    ).toBe("/sign-up/verify");
  });

  it("extracts profiles from normal sign-in responses", () => {
    const response = { data: { profiles: [{ id: "profile-1" }] } };

    expect(resolveAuthRedirect(response)).toBe("/select-profile");
    expect(getProfilesFromAuthResponse(response)).toEqual([{ id: "profile-1" }]);
  });
});
