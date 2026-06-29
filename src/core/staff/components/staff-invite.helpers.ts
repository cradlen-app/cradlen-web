import { ApiError } from "@/infrastructure/http/api";
import { STAFF_INVITE_DAYS } from "../lib/staff-invite.schemas";

export type DayCode = (typeof STAFF_INVITE_DAYS)[number];

export type ShiftTime = { start: string; end: string };

export type BranchScheduleState = {
  activeDays: Set<DayCode>;
  shifts: Record<DayCode, ShiftTime>;
};

export const DEFAULT_SHIFTS: Record<DayCode, ShiftTime> = Object.fromEntries(
  STAFF_INVITE_DAYS.map((d) => [d, { start: "09:00", end: "17:00" }]),
) as Record<DayCode, ShiftTime>;

export function makeDefaultBranchSchedule(): BranchScheduleState {
  return { activeDays: new Set(), shifts: { ...DEFAULT_SHIFTS } };
}

export function buildBranchSchedule(branchId: string, state: BranchScheduleState) {
  if (state.activeDays.size === 0) return null;
  return {
    branch_id: branchId,
    days: STAFF_INVITE_DAYS.filter((d) => state.activeDays.has(d)).map((d) => ({
      day_of_week: d,
      shifts: [
        { start_time: state.shifts[d].start, end_time: state.shifts[d].end },
      ],
    })),
  };
}

export function getPreviewErrorKey(error: unknown) {
  if (!(error instanceof ApiError)) return "serverError";
  if (error.status === 401) return "invalid";
  if (error.status === 409) return "accepted";
  if (error.status === 410) return "expired";
  return "serverError";
}

export function getInviteErrorKey(error: unknown) {
  if (!(error instanceof ApiError)) return "serverError";
  if (error.status === 401) return "invalid";
  if (error.status === 409) return "accepted";
  if (error.status === 410) return "expired";
  return "serverError";
}

