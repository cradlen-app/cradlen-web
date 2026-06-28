import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";
import { makeCalendarEvent } from "./__fixtures__/calendarEvent";
import type { CalendarEvent } from "../types/calendar.types";

const { useCalendarEventsMock } = vi.hoisted(() => ({
  useCalendarEventsMock: vi.fn(),
}));

vi.mock("../hooks/useCalendarEvents", () => ({
  useCalendarEvents: (params: unknown) => useCalendarEventsMock(params),
}));

import { TodaysCalendarCard } from "./TodaysCalendarCard";

function mockEvents(events: CalendarEvent[]) {
  useCalendarEventsMock.mockReturnValue({ data: events });
}

describe("TodaysCalendarCard", () => {
  beforeEach(() => {
    useCalendarEventsMock.mockReset();
  });

  it("renders an event entry with type label and patient", () => {
    mockEvents([
      makeCalendarEvent({
        title: "Knee scope",
        type: "PROCEDURE",
        procedureName: "Arthroscopy",
        patientName: "Jane Roe",
      }),
    ]);

    renderWithIntl(<TodaysCalendarCard date="2026-06-15" />);

    expect(screen.getByText("Knee scope")).toBeInTheDocument();
    expect(screen.getByText(/Arthroscopy/)).toBeInTheDocument();
    expect(screen.getByText("Jane Roe")).toBeInTheDocument();
  });

  it("shows the empty placeholder when no events touch the date", () => {
    mockEvents([]);

    renderWithIntl(<TodaysCalendarCard date="2026-06-15" />);

    expect(screen.getByText("No events scheduled")).toBeInTheDocument();
  });

  it("shows the all-day label for all-day events", () => {
    mockEvents([makeCalendarEvent({ allDay: true })]);

    renderWithIntl(<TodaysCalendarCard date="2026-06-15" />);

    expect(screen.getByText("All day")).toBeInTheDocument();
  });

  it("filters out events that do not overlap the requested date", () => {
    mockEvents([
      makeCalendarEvent({ id: "x", title: "Other day", startsAt: "2026-06-20T09:00:00.000Z", endsAt: "2026-06-20T10:00:00.000Z" }),
    ]);

    renderWithIntl(<TodaysCalendarCard date="2026-06-15" />);

    expect(screen.queryByText("Other day")).not.toBeInTheDocument();
    expect(screen.getByText("No events scheduled")).toBeInTheDocument();
  });
});
