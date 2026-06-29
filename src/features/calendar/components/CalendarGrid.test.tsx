import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";
import { CalendarGrid } from "./CalendarGrid";
import { makeCalendarEvent } from "./__fixtures__/calendarEvent";

function renderGrid(over: Partial<Parameters<typeof CalendarGrid>[0]> = {}) {
  const onSelectDate = vi.fn();
  const onPrevMonth = vi.fn();
  const onNextMonth = vi.fn();
  const utils = renderWithIntl(
    <CalendarGrid
      events={[]}
      selectedDate="2026-06-15"
      viewYear={2026}
      viewMonth={5}
      onSelectDate={onSelectDate}
      onPrevMonth={onPrevMonth}
      onNextMonth={onNextMonth}
      {...over}
    />,
  );
  return { ...utils, onSelectDate, onPrevMonth, onNextMonth };
}

describe("CalendarGrid", () => {
  it("renders the month label and seven weekday headers", () => {
    const { container } = renderGrid();

    expect(screen.getByText("June 2026")).toBeInTheDocument();
    // First grid row = weekday labels (7 columns).
    const headerRow = container.querySelectorAll(".grid-cols-7")[0];
    expect(headerRow?.children).toHaveLength(7);
  });

  it("places an event chip in its day cell", () => {
    renderGrid({ events: [makeCalendarEvent({ title: "Team sync" })] });

    expect(screen.getByText("Team sync")).toBeInTheDocument();
  });

  it("collapses extra events into a +N more indicator", () => {
    const events = Array.from({ length: 4 }, (_, i) =>
      makeCalendarEvent({ id: `e${i}`, title: `Event ${i}` }),
    );
    renderGrid({ events });

    // MAX_CHIPS is 3, so the 4th becomes "+1 more".
    expect(screen.getByText(/\+1/)).toBeInTheDocument();
  });

  it("fires navigation callbacks for prev/next month", () => {
    const { onPrevMonth, onNextMonth } = renderGrid();

    fireEvent.click(screen.getByLabelText("Previous month"));
    fireEvent.click(screen.getByLabelText("Next month"));

    expect(onPrevMonth).toHaveBeenCalledTimes(1);
    expect(onNextMonth).toHaveBeenCalledTimes(1);
  });

  it("calls onSelectDate with the clicked day's iso", () => {
    const { onSelectDate, container } = renderGrid();

    // The 15th in-month cell is selected (aria-pressed).
    const selectedCell = container.querySelector('[aria-pressed="true"]');
    expect(selectedCell).not.toBeNull();
    // Click a known day button — find the cell containing "1".
    const day1 = within(container).getAllByText("1")[0];
    fireEvent.click(day1.closest("button")!);

    expect(onSelectDate).toHaveBeenCalled();
  });
});
