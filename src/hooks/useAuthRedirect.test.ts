import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

import {
  getRegistrationStatusRedirectPath,
  isExpiredRegistrationStatusError,
} from "./useAuthRedirect";

describe("getRegistrationStatusRedirectPath", () => {
  it("stays on signup start for NONE", () => {
    expect(getRegistrationStatusRedirectPath("NONE", "NONE")).toBeNull();
  });

  it("redirects protected steps with NONE back to signup start", () => {
    expect(getRegistrationStatusRedirectPath("NONE", "VERIFY_OTP")).toBe(
      "/sign-up",
    );
    expect(getRegistrationStatusRedirectPath("NONE", "COMPLETE_ONBOARDING")).toBe(
      "/sign-up",
    );
  });

  it("routes to verify and complete onboarding steps", () => {
    expect(getRegistrationStatusRedirectPath("VERIFY_OTP", "NONE")).toBe(
      "/sign-up/verify",
    );
    expect(
      getRegistrationStatusRedirectPath("COMPLETE_ONBOARDING", "VERIFY_OTP"),
    ).toBe("/sign-up/complete");
  });

  it("does not redirect when already on the matching step", () => {
    expect(getRegistrationStatusRedirectPath("VERIFY_OTP", "VERIFY_OTP")).toBeNull();
    expect(
      getRegistrationStatusRedirectPath(
        "COMPLETE_ONBOARDING",
        "COMPLETE_ONBOARDING",
      ),
    ).toBeNull();
  });

  it("routes completed registration to sign-in", () => {
    expect(getRegistrationStatusRedirectPath("DONE", "COMPLETE_ONBOARDING")).toBe(
      "/sign-in",
    );
  });
});

describe("isExpiredRegistrationStatusError", () => {
  it("detects expired status sessions", () => {
    expect(isExpiredRegistrationStatusError(new ApiError(401, "Expired"))).toBe(
      true,
    );
    expect(isExpiredRegistrationStatusError(new ApiError(403, "Forbidden"))).toBe(
      true,
    );
  });

  it("ignores non-auth failures", () => {
    expect(isExpiredRegistrationStatusError(new ApiError(500, "Server"))).toBe(
      false,
    );
    expect(isExpiredRegistrationStatusError(new Error("Network"))).toBe(false);
  });
});
