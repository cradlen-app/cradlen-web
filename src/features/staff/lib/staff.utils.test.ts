import { describe, expect, it } from "vitest";
import { STAFF_API_ROLE } from "@/features/auth/lib/auth.constants";
import type { ApiStaffMember, ApiStaffSchedule } from "../types/staff.api.types";
import type { StaffMember } from "../types/staff.types";
import {
  computeStaffStatus,
  getStaffFullName,
  getStaffInitials,
  mapApiStaffToMember,
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

  it("normalises backend role names to the API role enum", () => {
    expect(normalizeApiRoleName("OWNER")).toBe(STAFF_API_ROLE.OWNER);
    expect(normalizeApiRoleName("branch_manager")).toBe(STAFF_API_ROLE.BRANCH_MANAGER);
    expect(normalizeApiRoleName("STAFF")).toBe(STAFF_API_ROLE.STAFF);
    expect(normalizeApiRoleName("EXTERNAL")).toBe(STAFF_API_ROLE.EXTERNAL);
    expect(normalizeApiRoleName("doctor")).toBe("UNKNOWN");
    expect(normalizeApiRoleName(undefined)).toBe("UNKNOWN");
  });

  it("maps backend staff members into display-ready staff members", () => {
    const apiMember: ApiStaffMember = {
      staff_id: "staff-1",
      user_id: "user-123456789",
      first_name: "Mona",
      last_name: "Said",
      email: "mona@example.com",
      phone_number: "+201000000000",
      executive_title: "COO",
      engagement_type: "FULL_TIME",
      roles: [{ id: "role-1", name: "OWNER" }],
      branches: [],
      job_functions: [
        { id: "jf-1", code: "OBGYN", name: "OB-GYN", is_clinical: true },
      ],
      specialties: [{ id: "sp-1", code: "PEDS", name: "Pediatrics" }],
      schedule: [{ branch_id: "b-1", days: mondaySchedule.days }],
    };

    const mapped = mapApiStaffToMember(apiMember, "en");
    expect(mapped).toMatchObject({
      id: "staff-1",
      firstName: "Mona",
      lastName: "Said",
      handle: "@mona",
      role: STAFF_API_ROLE.OWNER,
      executiveTitle: "COO",
      engagementType: "FULL_TIME",
      isClinical: true,
      phone: "+201000000000",
    });
    expect(mapped.workSchedule).toMatch(/Mon/i);
  });

  it("searches staff by visible fields including job functions and specialties", () => {
    const member: StaffMember = {
      id: "staff-1",
      firstName: "Nour",
      lastName: "Hassan",
      handle: "@nour",
      role: STAFF_API_ROLE.STAFF,
      roles: [{ id: "r1", name: "STAFF", role: STAFF_API_ROLE.STAFF }],
      branches: [],
      jobFunctions: [
        { id: "jf-1", code: "OBGYN", name: "OB-GYN", is_clinical: true },
      ],
      specialties: [{ id: "sp-1", code: "CARD", name: "Cardiology" }],
      executiveTitle: null,
      engagementType: "FULL_TIME",
      phone: "+2012",
      status: "available",
      isClinical: true,
    };

    expect(getStaffFullName(member)).toBe("Nour Hassan");
    expect(getStaffInitials("Nour Hassan")).toBe("NH");
    expect(matchesStaffSearch(member, "cardio")).toBe(true);
    expect(matchesStaffSearch(member, "ob-gyn")).toBe(true);
    expect(matchesStaffSearch(member, "unknown")).toBe(false);
  });
});
