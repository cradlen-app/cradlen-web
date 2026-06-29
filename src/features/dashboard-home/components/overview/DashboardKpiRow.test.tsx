import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render";

const useVisitMonthlyStats = vi.fn();
const usePatientStats = vi.fn();
const useFinancialReport = vi.fn();

vi.mock("@/features/visits/hooks/useVisitMonthlyStats", () => ({
  useVisitMonthlyStats: (...args: unknown[]) => useVisitMonthlyStats(...args),
}));
vi.mock("@/features/patients/hooks/usePatientStats", () => ({
  usePatientStats: (...args: unknown[]) => usePatientStats(...args),
}));
vi.mock("@/core/financial", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/core/financial")>();
  return {
    ...actual,
    useFinancialReport: (...args: unknown[]) => useFinancialReport(...args),
  };
});

import { DashboardKpiRow } from "./DashboardKpiRow";

beforeEach(() => {
  vi.clearAllMocks();
  useVisitMonthlyStats.mockReturnValue({
    data: {
      visits: { current: 30, previous: 20 },
      follow_ups: { current: 10, previous: 12 },
    },
    isLoading: false,
  });
  usePatientStats.mockReturnValue({
    data: { total: { current: 100, previous: 80 } },
    isLoading: false,
  });
  useFinancialReport.mockReturnValue({
    data: { total_collected: "5000" },
    isLoading: false,
  });
});

describe("DashboardKpiRow", () => {
  it("renders the base visit and follow-up KPI cards", () => {
    renderWithIntl(
      <DashboardKpiRow orgWide={false} showRevenue={false} showPatients={false} />,
    );
    expect(screen.getByText("Visits")).toBeInTheDocument();
    expect(screen.getByText("Follow-ups")).toBeInTheDocument();
    expect(screen.queryByText("Patients")).not.toBeInTheDocument();
    expect(screen.queryByText("Collected")).not.toBeInTheDocument();
  });

  it("includes the patients card when showPatients is set", () => {
    renderWithIntl(
      <DashboardKpiRow orgWide={false} showRevenue={false} showPatients />,
    );
    expect(screen.getByText("Patients")).toBeInTheDocument();
  });

  it("includes the collected-revenue card when showRevenue is set", () => {
    renderWithIntl(
      <DashboardKpiRow orgWide={false} showRevenue showPatients={false} />,
    );
    expect(screen.getByText("Collected")).toBeInTheDocument();
    expect(screen.getByText("EGP 5,000.00")).toBeInTheDocument();
  });

  it("renders skeletons while any required query is loading", () => {
    useVisitMonthlyStats.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = renderWithIntl(
      <DashboardKpiRow orgWide={false} showRevenue showPatients />,
    );
    expect(screen.queryByText("Visits")).not.toBeInTheDocument();
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });
});
