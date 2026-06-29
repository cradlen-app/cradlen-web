import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/render";

const mockTrend = vi.fn();
vi.mock("../../../hooks/usePatientVitalsTrend", () => ({
  usePatientVitalsTrend: (args: unknown) => mockTrend(args),
}));

// The leaf recharts components are covered separately; stub them here so the
// panel test stays focused on its loading/error/data branches.
vi.mock("./BpTrendChart", () => ({
  BpTrendChart: ({ emptyLabel }: { emptyLabel: string }) => (
    <div data-testid="bp-chart">{emptyLabel}</div>
  ),
}));
vi.mock("./BmiTrendChart", () => ({
  BmiTrendChart: ({ emptyLabel }: { emptyLabel: string }) => (
    <div data-testid="bmi-chart">{emptyLabel}</div>
  ),
}));

import { VisitChartsPanel } from "./VisitChartsPanel";

describe("VisitChartsPanel", () => {
  beforeEach(() => mockTrend.mockReset());

  it("renders the loading message while fetching", () => {
    mockTrend.mockReturnValue({ points: [], isLoading: true, isError: false });
    renderWithIntl(<VisitChartsPanel patientId="p-1" excludeVisitId="" />);
    expect(screen.getByText(/loading charts/i)).toBeInTheDocument();
    expect(screen.queryByTestId("bp-chart")).toBeNull();
  });

  it("renders the error message on failure", () => {
    mockTrend.mockReturnValue({ points: [], isLoading: false, isError: true });
    renderWithIntl(<VisitChartsPanel patientId="p-1" excludeVisitId="" />);
    expect(screen.getByText(/failed to load chart data/i)).toBeInTheDocument();
  });

  it("renders both BP and BMI trend charts on success", () => {
    mockTrend.mockReturnValue({ points: [], isLoading: false, isError: false });
    renderWithIntl(<VisitChartsPanel patientId="p-1" excludeVisitId="" />);
    expect(screen.getByText("Blood Pressure Trend")).toBeInTheDocument();
    expect(screen.getByText("Weight / BMI Trend")).toBeInTheDocument();
    expect(screen.getByTestId("bp-chart")).toBeInTheDocument();
    expect(screen.getByTestId("bmi-chart")).toBeInTheDocument();
  });
});
