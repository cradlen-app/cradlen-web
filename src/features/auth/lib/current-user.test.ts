import { describe, expect, it } from "vitest";
import type { CurrentUser, UserProfile } from "@/types/user.types";
import { getActiveProfile, getActiveRole } from "./current-user";

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
  it("selects the owner profile before a doctor profile", () => {
    const doctor = createProfile("doctor");
    const owner = createProfile("owner");
    const user = createUser([doctor, owner]);

    expect(getActiveProfile(user)).toBe(owner);
    expect(getActiveRole(user)).toBe("owner");
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
});
