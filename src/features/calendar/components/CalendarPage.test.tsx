import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";

import { renderWithIntl } from "@/test/render";

const mockCurrentUser = vi.fn();
const mockEvents = vi.fn();
const mockMediaQuery = vi.fn();
const mockIsClinical = vi.fn();
const mockIsOwner = vi.fn();
const mockIsBranchManager = vi.fn();

vi.mock("@/features/auth/hooks/useCurrentUser", () => ({
  useCurrentUser: () => mockCurrentUser(),
}));
vi.mock("@/features/auth/lib/current-user", () => ({
  getActiveProfile: () => ({ id: "prof-1" }),
}));
vi.mock("@/features/auth/lib/permissions", () => ({
  isClinical: () => mockIsClinical(),
  isOwner: () => mockIsOwner(),
  isBranchManager: () => mockIsBranchManager(),
}));
vi.mock("@/features/auth/store/authContextStore", () => ({
  useAuthContextStore: (selector: (s: Record<string, string>) => unknown) =>
    selector({ branchId: "br-1", profileId: "prof-1" }),
}));
vi.mock("../hooks/useCalendarEvents", () => ({
  useCalendarEvents: (args: unknown) => mockEvents(args),
}));
vi.mock("@/hooks/useMediaQuery", () => ({
  useMediaQuery: () => mockMediaQuery(),
}));

// Child surfaces are covered by their own suites; expose the callbacks we drive.
vi.mock("./CalendarGrid", () => ({
  CalendarGrid: ({
    onPrevMonth,
    onNextMonth,
    onSelectDate,
    viewYear,
    viewMonth,
  }: {
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onSelectDate: (d: string) => void;
    viewYear: number;
    viewMonth: number;
  }) => (
    <div data-testid="grid" data-year={viewYear} data-month={viewMonth}>
      <button onClick={onPrevMonth}>prev</button>
      <button onClick={onNextMonth}>next</button>
      <button onClick={() => onSelectDate("2026-07-04")}>select-day</button>
    </div>
  ),
}));
vi.mock("./CalendarOverviewPanel", () => ({
  CalendarOverviewPanel: () => <div data-testid="overview-panel" />,
}));
vi.mock("./NewEventDrawer", () => ({
  NewEventDrawer: ({ open }: { open: boolean }) => (
    <div data-testid="drawer" data-open={String(open)} />
  ),
}));

import { CalendarPage } from "./CalendarPage";

describe("CalendarPage", () => {
  beforeEach(() => {
    mockCurrentUser.mockReturnValue({ data: { id: "u-1" } });
    mockEvents.mockReturnValue({ data: [] });
    mockMediaQuery.mockReturnValue(true);
    mockIsClinical.mockReturnValue(false);
    mockIsOwner.mockReturnValue(true);
    mockIsBranchManager.mockReturnValue(false);
  });

  it("renders the title, scope toggle and grid", () => {
    renderWithIntl(<CalendarPage />);
    expect(screen.getByText("Calendar")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Calendar scope" })).toBeInTheDocument();
    expect(screen.getByTestId("grid")).toBeInTheDocument();
  });

  it("defaults owners to the branch scope", () => {
    renderWithIntl(<CalendarPage />);
    expect(screen.getByRole("button", { name: "Branch" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "My calendar" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("defaults plain clinicians to their personal calendar", () => {
    mockIsClinical.mockReturnValue(true);
    mockIsOwner.mockReturnValue(false);
    mockIsBranchManager.mockReturnValue(false);
    renderWithIntl(<CalendarPage />);
    expect(
      screen.getByRole("button", { name: "My calendar" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("toggles the scope when the other tab is clicked", () => {
    renderWithIntl(<CalendarPage />);
    fireEvent.click(screen.getByRole("button", { name: "My calendar" }));
    expect(screen.getByRole("button", { name: "My calendar" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("shows the create button for permitted roles and opens the drawer", () => {
    renderWithIntl(<CalendarPage />);
    expect(screen.getByTestId("drawer").dataset.open).toBe("false");
    fireEvent.click(screen.getByRole("button", { name: "+ New Event" }));
    expect(screen.getByTestId("drawer").dataset.open).toBe("true");
  });

  it("hides the create button when the user cannot create events", () => {
    mockIsClinical.mockReturnValue(false);
    mockIsOwner.mockReturnValue(false);
    mockIsBranchManager.mockReturnValue(false);
    renderWithIntl(<CalendarPage />);
    expect(screen.queryByRole("button", { name: "+ New Event" })).toBeNull();
  });

  it("advances the viewed month via the grid navigation", () => {
    renderWithIntl(<CalendarPage />);
    const grid = screen.getByTestId("grid");
    const startMonth = Number(grid.dataset.month);
    fireEvent.click(screen.getByRole("button", { name: "next" }));
    const nextMonth = Number(screen.getByTestId("grid").dataset.month);
    // Either incremented within the year, or wrapped to January.
    expect(nextMonth === (startMonth + 1) % 12).toBe(true);
  });
});
