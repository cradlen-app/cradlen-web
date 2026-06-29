import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/render";

const mockUseVisitStats = vi.fn();
vi.mock("../hooks/useVisitStats", () => ({
  useVisitStats: (params: unknown) => mockUseVisitStats(params),
}));

import { StatCards, StatCardsSkeleton } from "./StatCards";

describe("StatCards", () => {
  beforeEach(() => {
    mockUseVisitStats.mockReset();
  });

  it("renders the four stat values from the hook", () => {
    mockUseVisitStats.mockReturnValue({
      data: { totalVisits: 24, visits: 14, followUps: 7, medicalReps: 3 },
    });
    renderWithIntl(<StatCards branchId="br-1" date="2026-06-28" />);
    expect(screen.getByText("24")).toBeInTheDocument();
    expect(screen.getByText("14")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("forwards its params (including assignedToMe) to the hook", () => {
    mockUseVisitStats.mockReturnValue({
      data: { totalVisits: 0, visits: 0, followUps: 0, medicalReps: 0 },
    });
    renderWithIntl(
      <StatCards branchId="br-9" date="2026-06-28" assignedToMe />,
    );
    expect(mockUseVisitStats).toHaveBeenCalledWith({
      branchId: "br-9",
      date: "2026-06-28",
      assignedToMe: true,
    });
  });

  it("StatCardsSkeleton renders four placeholder cards", () => {
    const { container } = renderWithIntl(<StatCardsSkeleton />);
    const pulses = container.querySelectorAll(".animate-pulse");
    expect(pulses.length).toBeGreaterThanOrEqual(4);
  });
});
