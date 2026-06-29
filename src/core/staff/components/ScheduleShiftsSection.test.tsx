import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useForm } from "react-hook-form";

import { renderWithIntl } from "@/test/render";
import {
  getDefaultStaffInviteValues,
  type StaffInviteFormValues,
} from "../lib/staff-invite.schemas";
import ScheduleShiftsSection, {
  type ScheduleShiftsSectionProps,
} from "./ScheduleShiftsSection";

function Harness({ isDirectMode = false }: { isDirectMode?: boolean }) {
  const form = useForm<StaffInviteFormValues>({
    defaultValues: getDefaultStaffInviteValues([]),
  });
  return (
    <ScheduleShiftsSection
      control={form.control as unknown as ScheduleShiftsSectionProps["control"]}
      errors={
        form.formState.errors as unknown as ScheduleShiftsSectionProps["errors"]
      }
      isDirectMode={isDirectMode}
      register={
        form.register as unknown as ScheduleShiftsSectionProps["register"]
      }
    />
  );
}

describe("ScheduleShiftsSection", () => {
  it("renders a row per backend weekday code (Mon..Sun)", () => {
    renderWithIntl(<Harness />);
    for (const label of ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    // 7 day toggles
    expect(screen.getAllByRole("checkbox")).toHaveLength(7);
  });

  it("disables the time inputs while a day is not enabled", () => {
    renderWithIntl(<Harness />);
    const times = screen.getAllByLabelText(/start time|end time/i);
    expect(times.length).toBeGreaterThan(0);
    for (const input of times) {
      expect(input).toBeDisabled();
    }
  });

  it("shows the optional-schedule hint in direct mode", () => {
    renderWithIntl(<Harness isDirectMode />);
    expect(
      screen.getByText("Optional — assign a schedule now or later."),
    ).toBeInTheDocument();
  });
});
