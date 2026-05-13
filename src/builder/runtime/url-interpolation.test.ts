import { describe, expect, it } from "vitest";
import { interpolateUrl } from "./url-interpolation";

describe("interpolateUrl", () => {
  it("substitutes placeholders and strips the /v1 prefix", () => {
    expect(
      interpolateUrl("/v1/organizations/{org_id}/staff?clinical=true", {
        org_id: "org-1",
      }),
    ).toBe("/organizations/org-1/staff?clinical=true");
  });

  it("returns null when a referenced placeholder is missing", () => {
    expect(
      interpolateUrl("/v1/organizations/{org_id}/staff", { org_id: null }),
    ).toBeNull();
    expect(
      interpolateUrl("/v1/organizations/{org_id}/staff", {}),
    ).toBeNull();
  });

  it("leaves URLs without placeholders intact (minus the /v1 prefix)", () => {
    expect(interpolateUrl("/v1/specialties", {})).toBe("/specialties");
    expect(interpolateUrl("/specialties", {})).toBe("/specialties");
  });

  it("URL-encodes substituted values", () => {
    expect(
      interpolateUrl("/v1/orgs/{org_id}/staff", { org_id: "a b/c" }),
    ).toBe("/orgs/a%20b%2Fc/staff");
  });
});
