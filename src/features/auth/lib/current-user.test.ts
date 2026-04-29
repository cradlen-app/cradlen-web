import { describe, expect, it } from "vitest";
import type { CurrentUser, UserProfile } from "@/types/user.types";
import {
  getActiveProfile,
  getActiveRole,
  getBranchId,
  getDefaultBranch,
  getProfileAccountName,
  getProfileRoles,
} from "./current-user";

function createProfile(roleName: UserProfile["role"]["name"]): UserProfile {
  return {
    staff_id: `${roleName}-staff`,
    job_title: `${roleName} title`,
    role: { id: `${roleName}-role`, name: roleName },
    organization: {
      id: "org-1",
      name: "Test Clinic",
      specialities: ["Cardiology"],
      status: "active",
    },
    branch: {
      id: "branch-1",
      address: "123 Main St",
      city: "Cairo",
      governorate: "Cairo",
      is_main: true,
    },
  };
}

function createUser(profiles: UserProfile[]): CurrentUser {
  return {
    id: "user-1",
    first_name: "Nour",
    last_name: "Hassan",
    email: "nour@example.com",
    is_active: true,
    verified_at: "2026-04-28T00:00:00.000Z",
    created_at: "2026-04-28T00:00:00.000Z",
    profiles,
  };
}

describe("current user helpers", () => {
  it("falls back to the first profile when no profile is selected", () => {
    const doctor = createProfile("doctor");
    const owner = createProfile("owner");
    const user = createUser([doctor, owner]);

    expect(getActiveProfile(user)).toBe(doctor);
    expect(getActiveRole(user)).toBe("doctor");
  });

  it("falls back to the first profile when no owner profile exists", () => {
    const doctor = createProfile("doctor");
    const receptionist = createProfile("receptionist");

    expect(getActiveProfile(createUser([doctor, receptionist]))).toBe(doctor);
  });

  it("handles empty or missing profiles safely", () => {
    expect(getActiveProfile(createUser([]))).toBeUndefined();
    expect(getActiveRole(null)).toBeUndefined();
  });

  it("normalizes profile roles from the profiles selection response", () => {
    const profile = {
      profile_id: "profile-1",
      account_id: "account-1",
      account_name: "Selection Clinic",
      roles: ["OWNER", "DOCTOR"],
      branches: [],
    } as unknown as UserProfile;

    expect(getProfileAccountName(profile)).toBe("Selection Clinic");
    expect(getProfileRoles(profile)).toEqual(["owner", "doctor"]);
  });

  it("supports branch_id when selecting and reading branches", () => {
    const profile = {
      profile_id: "profile-1",
      account_id: "account-1",
      roles: ["OWNER"],
      branches: [
        { branch_id: "branch-1", name: "Main", is_main: true },
        { branch_id: "branch-2", name: "Second", is_main: false },
      ],
    } as unknown as UserProfile;

    expect(getBranchId(getDefaultBranch(profile, "branch-2"))).toBe("branch-2");
  });
});
