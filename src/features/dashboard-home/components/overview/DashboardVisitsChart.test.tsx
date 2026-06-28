import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render";

const useVisitMonthlyStats = vi.fn();

vi.mock("@/features/visits/hooks/useVisitMonthlyStats", () => ({
  useVisitMonthlyStats: (...args: unknown[]) => useVisitMonthlyStats(...args),
}));

import { DashboardVisitsChart } from "./DashboardVisitsChart";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DashboardVisitsChart", () => {
  it("always renders the section title", () => {
    useVisitMonthlyStats.mockReturnValue({ data: { daily: [] }, isLoading: false });
    renderWithIntl(<DashboardVisitsChart orgWide={false} />);
    expect(screen.getByText("Visit throughput")).toBeInTheDocument();
  });

  it("renders the empty state when there are no daily rows", () => {
    useVisitMonthlyStats.mockReturnValue({ data: { daily: [] }, isLoading: false });
    renderWithIntl(<DashboardVisitsChart orgWide={false} />);
    expect(screen.getByText("No data yet")).toBeInTheDocument();
  });

  it("does not show the empty state while loading", () => {
    useVisitMonthlyStats.mockReturnValue({ data: undefined, isLoading: true });
    renderWithIntl(<DashboardVisitsChart orgWide={false} />);
    expect(screen.queryByText("No data yet")).not.toBeInTheDocument();
  });

  it("renders the chart container when daily rows exist", () => {
    useVisitMonthlyStats.mockReturnValue({
      data: { daily: [{ date: "2026-06-01", visits: 5, follow_ups: 2 }] },
      isLoading: false,
    });
    renderWithIntl(<DashboardVisitsChart orgWide={false} />);
    // Not empty / not loading branch
    expect(screen.queryByText("No data yet")).not.toBeInTheDocument();
    expect(screen.getByText("Visit throughput")).toBeInTheDocument();
  });
});
