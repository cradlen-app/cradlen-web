import { describe, expect, it } from "vitest";
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
