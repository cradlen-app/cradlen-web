import { describe, expect, it } from "vitest";
import {
  getProfilesFromAuthResponse,
  resolveAuthRedirect,
} from "./redirect";

describe("resolveAuthRedirect", () => {
  it("routes onboarding verify responses to /sign-up to mint a fresh signup token", () => {
    expect(
      resolveAuthRedirect({
        type: "ONBOARDING_REQUIRED",
        step: "VERIFY_OTP",
      }),
    ).toBe("/sign-up");
  });

  it("routes onboarding complete responses to /sign-up to mint a fresh signup token", () => {
    expect(
      resolveAuthRedirect({
        data: {
          type: "ONBOARDING_REQUIRED",
          step: "COMPLETE_ONBOARDING",
        },
      }),
    ).toBe("/sign-up");
  });

  it("routes wrapped and unwrapped profile responses to profile selection", () => {
    expect(resolveAuthRedirect({ profiles: [{ id: "profile-1" }] })).toBe(
      "/select-profile",
    );
    expect(
      resolveAuthRedirect({ data: { profiles: [{ id: "profile-1" }] } }),
    ).toBe("/select-profile");
  });

  it("falls back safely for invalid onboarding steps", () => {
    expect(
      resolveAuthRedirect({
        type: "ONBOARDING_REQUIRED",
        step: "UNKNOWN",
      }),
    ).toBe("/sign-in");
  });

  it("returns null for unknown responses", () => {
    expect(resolveAuthRedirect({ data: { authenticated: true } })).toBeNull();
    expect(resolveAuthRedirect(null)).toBeNull();
  });
});

describe("getProfilesFromAuthResponse", () => {
  it("extracts only array profile payloads", () => {
    expect(getProfilesFromAuthResponse({ data: { profiles: [] } })).toEqual([]);
    expect(getProfilesFromAuthResponse({ data: { profiles: "bad" } })).toEqual([]);
  });
});
