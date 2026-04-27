import { z } from "zod";
import type { ApiStaffDay } from "../types/staff.api.types";
import type { StaffRole } from "../types/staff.types";

export const STAFF_INVITE_DAYS = [
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
  "SUN",
] as const satisfies ApiStaffDay["day_of_week"][];

export const STAFF_INVITE_DAY_LABELS: Record<ApiStaffDay["day_of_week"], string> = {
  MON: "Mon",
  TUE: "Tue",
  WED: "Wed",
  THU: "Thu",
  FRI: "Fri",
  SAT: "Sat",
  SUN: "Sun",
};

const shiftSchema = z.object({
  day: z.enum(STAFF_INVITE_DAYS),
  enabled: z.boolean(),
  startTime: z.string(),
  endTime: z.string(),
});

export const staffInviteSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    roleId: z.string().min(1, "Role is required"),
    role: z.enum(["owner", "doctor", "reception"]),
    jobTitle: z.string().trim().min(1, "Job title is required"),
    phone: z.string().trim().optional(),
    isClinical: z.boolean(),
    specialty: z.string().trim().optional(),
    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .email("Enter a valid email address"),
    shifts: z.array(shiftSchema),
  })
  .superRefine((value, ctx) => {
    const nameParts = value.name.split(/\s+/).filter(Boolean);

    if (nameParts.length < 2) {
      ctx.addIssue({
        code: "custom",
        path: ["name"],
        message: "Enter first and last name",
      });
    }

    const needsSpecialty =
      value.role === "doctor" || (value.role === "owner" && value.isClinical);

    if (needsSpecialty && !value.specialty) {
      ctx.addIssue({
        code: "custom",
        path: ["specialty"],
        message: "Specialty is required",
      });
    }

    const enabledShifts = value.shifts.filter((shift) => shift.enabled);

    if (enabledShifts.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["shifts", "root"],
        message: "Select at least one working day",
      });
    }

    value.shifts.forEach((shift, index) => {
      if (!shift.enabled) return;

      if (!shift.startTime) {
        ctx.addIssue({
          code: "custom",
          path: ["shifts", index, "startTime"],
          message: "Start time is required",
        });
      }

      if (!shift.endTime) {
        ctx.addIssue({
          code: "custom",
          path: ["shifts", index, "endTime"],
          message: "End time is required",
        });
      }

      if (shift.startTime && shift.endTime && shift.startTime >= shift.endTime) {
        ctx.addIssue({
          code: "custom",
          path: ["shifts", index, "endTime"],
          message: "End time must be later",
        });
      }
    });
  });

export type StaffInviteFormValues = z.infer<typeof staffInviteSchema>;

export function getDefaultStaffInviteValues(): StaffInviteFormValues {
  return {
    name: "",
    roleId: "",
    role: "doctor" satisfies StaffRole,
    jobTitle: "",
    phone: "",
    isClinical: false,
    specialty: "",
    email: "",
    shifts: STAFF_INVITE_DAYS.map((day) => ({
      day,
      enabled: false,
      startTime: "09:00",
      endTime: "17:00",
    })),
  };
}

export function splitStaffName(name: string) {
  const [firstName = "", ...rest] = name.trim().split(/\s+/);

  return {
    firstName,
    lastName: rest.join(" "),
  };
}
