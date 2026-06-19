import { describe, expect, it } from "vitest";
import type { UserProfile } from "@/common/types/user.types";
import { getDefaultRouteForRole } from "./redirect";

const ORG = "org-1";
const BR = "br-1";

function profile(opts: {
  role?: string;
  jobFunction?: { code: string; is_clinical: boolean };
}): UserProfile {
  return {
    role: { id: opts.role ?? "STAFF", name: opts.role ?? "STAFF" },
    job_function: opts.jobFunction ?? null,
  } as unknown as UserProfile;
}

describe("getDefaultRouteForRole", () => {
  it("lands the back-office accountant in the financial section", () => {
    const p = profile({ jobFunction: { code: "ACCOUNTANT", is_clinical: false } });
    expect(getDefaultRouteForRole(undefined, ORG, BR, p)).toBe(
      `/${ORG}/${BR}/dashboard/financial/invoices`,
    );
  });

  it("still lands the receptionist on /visits", () => {
    const p = profile({ jobFunction: { code: "RECEPTIONIST", is_clinical: false } });
    expect(getDefaultRouteForRole(undefined, ORG, BR, p)).toBe(
      `/${ORG}/${BR}/dashboard/visits`,
    );
  });

  it("lands an owner on the dashboard home", () => {
    expect(getDefaultRouteForRole("owner", ORG, BR, profile({ role: "OWNER" }))).toBe(
      `/${ORG}/${BR}/dashboard`,
    );
  });
});
