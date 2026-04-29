import { describe, expect, it } from "vitest";
import { canAccessRoute } from "./dashboard-access";

describe("canAccessRoute", () => {
  it("allows owners and doctors to access settings", () => {
    expect(canAccessRoute("owner", "/dashboard/settings")).toBe(true);
    expect(canAccessRoute("doctor", "/dashboard/settings")).toBe(true);
  });

  it("blocks receptionists and patients from settings", () => {
    expect(canAccessRoute("receptionist", "/dashboard/settings")).toBe(false);
    expect(canAccessRoute("patient", "/dashboard/settings")).toBe(false);
  });
});
