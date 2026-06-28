import { describe, expect, it } from "vitest";
import { staffQueryKeys, STAFF_QUERY_KEY_ROOT } from "./queryKeys";

describe("staffQueryKeys", () => {
  it("exposes broad and org-scoped keys", () => {
    expect(staffQueryKeys.all()).toEqual(["staff"]);
    expect(staffQueryKeys.byOrg("org-1")).toEqual(["staff", "org-1"]);
  });

  it("builds the list key from all filter facets in order", () => {
    expect(
      staffQueryKeys.list("org-1", {
        search: "ali",
        branchId: "b-1",
        role: "OWNER",
        status: "active",
      }),
    ).toEqual(["staff", "org-1", "ali", "b-1", "OWNER", "active"]);
  });

  it("leaves omitted filter facets as undefined slots", () => {
    expect(staffQueryKeys.list("org-1", {})).toEqual([
      "staff",
      "org-1",
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });

  it("builds detail / stats / roles keys", () => {
    expect(staffQueryKeys.detail("org-1", "b-1", "s-1")).toEqual([
      "staff",
      "detail",
      "org-1",
      "b-1",
      "s-1",
    ]);
    expect(staffQueryKeys.stats("org-1", "b-1")).toEqual([
      "staff",
      "stats",
      "org-1",
      "b-1",
    ]);
    expect(staffQueryKeys.roles("org-1")).toEqual(["staff-roles", "org-1"]);
  });

  it("builds the invitation preview key", () => {
    expect(staffQueryKeys.invitationPreview("inv-1", "tok")).toEqual([
      "staff",
      "invitation-preview",
      "inv-1",
      "tok",
    ]);
  });

  describe("invitations", () => {
    it("builds list/detail keys under their own root", () => {
      expect(staffQueryKeys.invitations.all()).toEqual(["staff-invitations"]);
      expect(
        staffQueryKeys.invitations.list("org-1", "b-1", {
          page: 2,
          limit: 50,
          status: "PENDING",
        }),
      ).toEqual(["staff-invitations", "org-1", "b-1", 2, 50, "PENDING"]);
      expect(
        staffQueryKeys.invitations.detail("org-1", "b-1", "inv-1"),
      ).toEqual(["staff-invitations", "detail", "org-1", "b-1", "inv-1"]);
    });
  });

  it("exposes the registered root key", () => {
    expect(STAFF_QUERY_KEY_ROOT).toEqual(["staff"]);
  });
});
