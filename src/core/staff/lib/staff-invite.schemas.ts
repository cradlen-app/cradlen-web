import { z } from "zod";
import {
  DEFAULT_ENGAGEMENT_TYPE,
  ENGAGEMENT_TYPE,
  EXECUTIVE_TITLE,
} from "@/features/auth/lib/auth.constants";
import type { ApiStaffDay } from "../types/staff.api.types";

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

const ENGAGEMENT_VALUES = Object.values(ENGAGEMENT_TYPE) as [
  (typeof ENGAGEMENT_TYPE)[keyof typeof ENGAGEMENT_TYPE],
  ...(typeof ENGAGEMENT_TYPE)[keyof typeof ENGAGEMENT_TYPE][],
];

const EXECUTIVE_VALUES = Object.values(EXECUTIVE_TITLE) as [
  (typeof EXECUTIVE_TITLE)[keyof typeof EXECUTIVE_TITLE],
  ...(typeof EXECUTIVE_TITLE)[keyof typeof EXECUTIVE_TITLE][],
];

const staffBaseSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  /** Backend role UUID — at least one required. */
  roleId: z.string().min(1, "Role is required"),
  phone: z.string().trim().optional(),
  jobFunctionCodes: z.array(z.string()),
  specialtyCodes: z.array(z.string()),
  executiveTitle: z.enum(EXECUTIVE_VALUES).nullable(),
  engagementType: z.enum(ENGAGEMENT_VALUES),
  branchIds: z.array(z.string()).min(1, "At least one branch is required"),
  shifts: z.array(shiftSchema),
});

function validateName(value: { name: string }, ctx: z.RefinementCtx) {
  const parts = value.name.split(/\s+/).filter(Boolean);
  if (parts.length < 2) {
    ctx.addIssue({ code: "custom", path: ["name"], message: "Enter first and last name" });
  }
}

function validateShiftTimes(
  value: { shifts: { enabled: boolean; startTime: string; endTime: string }[] },
  ctx: z.RefinementCtx,
) {
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
}

export const staffInviteSchema = staffBaseSchema
  .extend({
    email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  })
  .superRefine((value, ctx) => {
    validateName(value, ctx);
    validateShiftTimes(value, ctx);
  });

export const staffEditSchema = staffBaseSchema
  .extend({
    email: z.string(),
  })
  .superRefine((value, ctx) => {
    validateName(value, ctx);
    validateShiftTimes(value, ctx);
  });

export const staffCreateDirectSchema = staffBaseSchema
  .extend({
    phone: z.string().trim().min(1, "Phone number is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
  })
  .superRefine((value, ctx) => {
    validateName(value, ctx);
    if (value.shifts.some((s) => s.enabled)) validateShiftTimes(value, ctx);
  });

export type StaffInviteFormValues = z.infer<typeof staffInviteSchema>;
export type StaffEditFormValues = z.infer<typeof staffEditSchema>;
export type StaffFormValues = StaffInviteFormValues | StaffEditFormValues;
export type StaffCreateDirectFormValues = z.infer<typeof staffCreateDirectSchema>;

function defaultShifts() {
  return STAFF_INVITE_DAYS.map((day) => ({
    day,
    enabled: false,
    startTime: "09:00",
    endTime: "17:00",
  }));
}

export function getDefaultStaffInviteValues(branchIds: string[] = []): StaffInviteFormValues {
  return {
    name: "",
    roleId: "",
    phone: "",
    jobFunctionCodes: [],
    specialtyCodes: [],
    executiveTitle: null,
    engagementType: DEFAULT_ENGAGEMENT_TYPE,
    branchIds,
    email: "",
    shifts: defaultShifts(),
  };
}

export function getDefaultStaffCreateDirectValues(
  branchIds: string[] = [],
): StaffCreateDirectFormValues {
  return {
    name: "",
    roleId: "",
    phone: "",
    password: "",
    jobFunctionCodes: [],
    specialtyCodes: [],
    executiveTitle: null,
    engagementType: DEFAULT_ENGAGEMENT_TYPE,
    branchIds,
    shifts: defaultShifts(),
  };
}

export function splitStaffName(name: string) {
  const [firstName = "", ...rest] = name.trim().split(/\s+/);
  return { firstName, lastName: rest.join(" ") };
}
