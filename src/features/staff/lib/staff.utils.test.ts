import { describe, expect, it } from "vitest";
import type { ApiStaffMember, ApiStaffSchedule } from "../types/staff.api.types";
import {
  computeStaffStatus,
  getStaffFullName,
  getStaffInitials,
  mapLegacyApiStaffToMember,
  matchesStaffSearch,
  normalizeApiRoleName,
} from "./staff.utils";

const mondaySchedule: ApiStaffSchedule = {
  id: "schedule-1",
  days: [
    {
      id: "day-1",
      day_of_week: "MON",
      shifts: [{ id: "shift-1", start_time: "09:00", end_time: "17:00" }],
    },
  ],
};

describe("staff utils", () => {
  it("computes availability from the current day schedule", () => {
    expect(computeStaffStatus(mondaySchedule, new Date("2026-04-27T10:30:00"))).toBe(
      "available",
    );
    expect(computeStaffStatus(mondaySchedule, new Date("2026-04-27T17:00:00"))).toBe(
      "notAvailable",
    );
    expect(computeStaffStatus(mondaySchedule, new Date("2026-04-28T10:30:00"))).toBe(
      "notAvailable",
    );
  });

  it("keeps unknown backend roles unknown", () => {
    expect(normalizeApiRoleName("owner")).toBe("owner");
    expect(normalizeApiRoleName("receptionist")).toBe("reception");
    expect(normalizeApiRoleName("doctor")).toBe("doctor");
    expect(normalizeApiRoleName("dentist")).toBe("unknown");
  });

  it("maps backend staff members into display-ready staff members", () => {
    const apiMember: ApiStaffMember = {
      id: "staff-1",
      profile_id: "staff-1",
      user_id: "user-123456789",
      first_name: "Mona",
      last_name: "Said",
      email: "mona@example.com",
      organization_id: "org-1",
      branch_id: "branch-1",
      role_id: "role-1",
      job_title: "Clinic owner",
      specialty: "Pediatrics",
      created_at: "2026-04-28T00:00:00Z",
      schedule: mondaySchedule,
      roles: [{ id: "role-1", name: "owner" }],
      branches: [],
      role: { id: "role-1", name: "owner" },
      user: {
        id: "user-1",
        first_name: "Mona",
        last_name: "Said",
        email: "mona@example.com",
        phone_number: "+201000000000",
      },
    };

    expect(mapLegacyApiStaffToMember(apiMember)).toMatchObject({
      id: "staff-1",
      roleId: "role-1",
      firstName: "Mona",
      lastName: "Said",
      handle: "@mona",
      role: "owner",
      jobTitle: "Clinic owner",
      specialty: "Pediatrics",
      phone: "+201000000000",
      workSchedule: "Mon: 9:00AM - 5:00PM",
    });
  });

  it("searches staff by common visible fields", () => {
    const member = {
      id: "staff-1",
      firstName: "Nour",
      lastName: "Hassan",
      handle: "@nour",
      role: "doctor" as const,
      roleId: "doctor-role",
      jobTitle: "Senior Doctor",
      specialty: "Cardiology",
      phone: "+2012",
      status: "available" as const,
    };

    expect(getStaffFullName(member)).toBe("Nour Hassan");
    expect(getStaffInitials("Nour Hassan")).toBe("NH");
    expect(matchesStaffSearch(member, "cardio")).toBe(true);
    expect(matchesStaffSearch(member, "unknown")).toBe(false);
  });
});
