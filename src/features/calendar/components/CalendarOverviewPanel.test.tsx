import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";
import { makeCalendarEvent } from "./__fixtures__/calendarEvent";

const { useUserProfileContextMock, deleteMutateMock } = vi.hoisted(() => ({
  useUserProfileContextMock: vi.fn(),
  deleteMutateMock: vi.fn(),
}));

vi.mock("@/features/auth/hooks/useUserProfileContext", () => ({
  useUserProfileContext: () => useUserProfileContextMock(),
}));

vi.mock("../hooks/useDeleteCalendarEvent", () => ({
  useDeleteCalendarEvent: () => ({ mutate: deleteMutateMock, isPending: false }),
}));

import { CalendarOverviewPanel } from "./CalendarOverviewPanel";

describe("CalendarOverviewPanel", () => {
  beforeEach(() => {
    useUserProfileContextMock.mockReset();
    deleteMutateMock.mockReset();
    useUserProfileContextMock.mockReturnValue({ currentUserStaffId: "p1" });
  });

  it("renders the events for the selected date", () => {
    renderWithIntl(
      <CalendarOverviewPanel
        events={[makeCalendarEvent({ title: "Team sync" })]}
        selectedDate="2026-06-15"
      />,
    );

    expect(screen.getByText("Team sync")).toBeInTheDocument();
  });

  it("shows the empty state when the day has no events", () => {
    renderWithIntl(
      <CalendarOverviewPanel events={[]} selectedDate="2026-06-15" />,
    );

    expect(screen.getByText("No events scheduled")).toBeInTheDocument();
  });

  it("exposes edit/delete only for events the current user owns", () => {
    renderWithIntl(
      <CalendarOverviewPanel
        events={[makeCalendarEvent({ profileId: "p1" })]}
        selectedDate="2026-06-15"
        onEditEvent={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Edit event")).toBeInTheDocument();
    expect(screen.getByLabelText("Delete event")).toBeInTheDocument();
  });

  it("hides manage controls for events owned by others", () => {
    renderWithIntl(
      <CalendarOverviewPanel
        events={[makeCalendarEvent({ profileId: "someone-else" })]}
        selectedDate="2026-06-15"
      />,
    );

    expect(screen.queryByLabelText("Edit event")).not.toBeInTheDocument();
  });

  it("invokes onEditEvent when the edit button is clicked", () => {
    const onEditEvent = vi.fn();
    const event = makeCalendarEvent({ profileId: "p1" });
    renderWithIntl(
      <CalendarOverviewPanel
        events={[event]}
        selectedDate="2026-06-15"
        onEditEvent={onEditEvent}
      />,
    );

    fireEvent.click(screen.getByLabelText("Edit event"));

    expect(onEditEvent).toHaveBeenCalledWith(event);
  });

  it("deletes after the confirm prompt is accepted", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const event = makeCalendarEvent({ id: "del-1", profileId: "p1" });
    renderWithIntl(
      <CalendarOverviewPanel events={[event]} selectedDate="2026-06-15" />,
    );

    fireEvent.click(screen.getByLabelText("Delete event"));

    expect(deleteMutateMock).toHaveBeenCalledWith("del-1");
  });

  it("expands to reveal description details", () => {
    renderWithIntl(
      <CalendarOverviewPanel
        events={[makeCalendarEvent({ description: "Quarterly review" })]}
        selectedDate="2026-06-15"
      />,
    );

    fireEvent.click(screen.getByLabelText("Expand"));

    expect(screen.getByText("Quarterly review")).toBeInTheDocument();
  });
});
