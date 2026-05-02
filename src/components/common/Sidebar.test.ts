import { describe, expect, it } from "vitest";
import { canUseSettings } from "./sidebar-access";

describe("canUseSettings", () => {
  it("shows settings only for owner and doctor roles", () => {
    expect(canUseSettings("owner")).toBe(true);
    expect(canUseSettings("doctor")).toBe(true);
    expect(canUseSettings("reception")).toBe(false);
    expect(canUseSettings("patient")).toBe(false);
    expect(canUseSettings(undefined)).toBe(false);
  });
});
