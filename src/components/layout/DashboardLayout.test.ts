import { describe, expect, it } from "vitest";
import {
  ENGAGEMENT_TYPE,
  JOB_FUNCTION_CODE,
  STAFF_API_ROLE,
} from "@/features/auth/lib/auth.constants";
import type { UserProfile } from "@/types/user.types";
import { canAccessRoute } from "./dashboard-access";

function makeProfile(
  overrides: Partial<UserProfile> & {
    roleName?: string;
    jobFunctionCode?: string;
    isClinical?: boolean;
  } = {},
): UserProfile {
  const { roleName, jobFunctionCode, isClinical, ...rest } = overrides;
  return {
    staff_id: "staff-1",
    roles: roleName ? [{ id: "r-1", name: roleName }] : [],
    organization: { id: "org-1", name: "Org", status: "ACTIVE" },
    branches: [],
    job_functions: jobFunctionCode
      ? [
          {
            id: "jf-1",
            code: jobFunctionCode,
            name: jobFunctionCode,
            is_clinical: !!isClinical,
          },
        ]
      : [],
    engagement_type: ENGAGEMENT_TYPE.FULL_TIME,
    ...rest,
  };
}

describe("canAccessRoute", () => {
  it("allows owner to access every dashboard route", () => {
    const owner = makeProfile({ roleName: STAFF_API_ROLE.OWNER });
    expect(canAccessRoute(owner, "/dashboard")).toBe(true);
    expect(canAccessRoute(owner, "/dashboard/settings")).toBe(true);
    expect(canAccessRoute(owner, "/dashboard/staff")).toBe(true);
    expect(canAccessRoute(owner, "/dashboard/medicine")).toBe(true);
    expect(canAccessRoute(owner, "/dashboard/analytics")).toBe(true);
  });

  it("allows STAFF + RECEPTIONIST job function to access /staff but not /medicine", () => {
    const recept = makeProfile({
      roleName: STAFF_API_ROLE.STAFF,
      jobFunctionCode: JOB_FUNCTION_CODE.RECEPTIONIST,
    });
    expect(canAccessRoute(recept, "/dashboard")).toBe(true);
    expect(canAccessRoute(recept, "/dashboard/staff")).toBe(true);
    expect(canAccessRoute(recept, "/dashboard/medicine")).toBe(false);
  });

  it("allows STAFF + clinical job function to access /medicine but not /staff", () => {
    const clinical = makeProfile({
      roleName: STAFF_API_ROLE.STAFF,
      jobFunctionCode: JOB_FUNCTION_CODE.OBGYN,
      isClinical: true,
    });
    expect(canAccessRoute(clinical, "/dashboard/medicine")).toBe(true);
    expect(canAccessRoute(clinical, "/dashboard/staff")).toBe(false);
  });

  it("denies access for users without any staff role", () => {
    expect(canAccessRoute(makeProfile(), "/dashboard")).toBe(false);
    expect(canAccessRoute(undefined, "/dashboard")).toBe(false);
  });
});
