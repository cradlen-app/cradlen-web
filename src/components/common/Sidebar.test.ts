import { describe, expect, it } from "vitest";
import {
  ENGAGEMENT_TYPE,
  JOB_FUNCTION_CODE,
  STAFF_API_ROLE,
} from "@/features/auth/lib/auth.constants";
import type { UserProfile } from "@/common/types/user.types";
import { canUseSettings } from "./sidebar-access";

function makeProfile(
  overrides: Partial<UserProfile> & {
    roleName?: string;
    jobFunctionCode?: string;
  } = {},
): UserProfile {
  const { roleName, jobFunctionCode, ...rest } = overrides;
  return {
    staff_id: "staff-1",
    roles: roleName ? [{ id: "r-1", name: roleName }] : [],
    organization: { id: "org-1", name: "Org", status: "ACTIVE" },
    branches: [],
    job_functions: jobFunctionCode
      ? [{ id: "jf-1", code: jobFunctionCode, name: jobFunctionCode, is_clinical: false }]
      : [],
    engagement_type: ENGAGEMENT_TYPE.FULL_TIME,
    ...rest,
  };
}

describe("canUseSettings", () => {
  it("allows any staff member to access settings", () => {
    expect(canUseSettings(makeProfile({ roleName: STAFF_API_ROLE.OWNER }))).toBe(true);
    expect(canUseSettings(makeProfile({ roleName: STAFF_API_ROLE.BRANCH_MANAGER }))).toBe(
      true,
    );
    expect(
      canUseSettings(
        makeProfile({
          roleName: STAFF_API_ROLE.STAFF,
          jobFunctionCode: JOB_FUNCTION_CODE.RECEPTIONIST,
        }),
      ),
    ).toBe(true);
    expect(canUseSettings(makeProfile({ roleName: STAFF_API_ROLE.EXTERNAL }))).toBe(true);
  });

  it("denies non-staff (no role / undefined)", () => {
    expect(canUseSettings(makeProfile())).toBe(false);
    expect(canUseSettings(undefined)).toBe(false);
  });
});
