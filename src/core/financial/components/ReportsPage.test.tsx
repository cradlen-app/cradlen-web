import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";

const { useFinancialReportMock } = vi.hoisted(() => ({
  useFinancialReportMock: vi.fn(),
}));

vi.mock("../hooks/useReports", () => ({
  useFinancialReport: (name: string) => useFinancialReportMock(name),
}));

import { ReportsPage } from "./ReportsPage";

type ReportMap = Record<string, unknown>;

/** Drive `useFinancialReport(name)` from a name→data map (missing → empty). */
function mockReports(map: ReportMap) {
  useFinancialReportMock.mockImplementation((name: string) => ({
    data: map[name] ?? null,
    isLoading: false,
    error: null,
  }));
}

const REVENUE = {
  total_invoiced: 10000,
  total_collected: 7500,
  outstanding: 2500,
  invoice_count: 42,
};
const DAILY = {
  rows: [{ date: "2026-06-01", invoiced: 4000, collected: 3000, invoice_count: 4 }],
};
const AR = {
  buckets: { current: 1000, d1_30: 700, d31_60: 400, d61_90: 250, d90_plus: 150 },
  total_outstanding: 2500,
};

describe("ReportsPage — Overview", () => {
  beforeEach(() => {
    useFinancialReportMock.mockReset();
  });

  it("renders KPI cards with the derived collection rate", () => {
    mockReports({ revenue: REVENUE, "daily-revenue": DAILY, "ar-aging": AR });

    renderWithIntl(<ReportsPage />);

    expect(screen.getByText("Total invoiced")).toBeInTheDocument();
    expect(screen.getByText("EGP 10,000.00")).toBeInTheDocument();
    expect(screen.getByText("Collection rate")).toBeInTheDocument();
    expect(screen.getByText("75.0%")).toBeInTheDocument(); // 7500 / 10000
  });

  it("guards divide-by-zero in the collection rate", () => {
    mockReports({
      revenue: { ...REVENUE, total_invoiced: 0, total_collected: 0 },
    });

    renderWithIntl(<ReportsPage />);

    expect(screen.getByText("0.0%")).toBeInTheDocument();
  });

  it("sorts top doctors by revenue and caps at five", () => {
    mockReports({
      revenue: REVENUE,
      "revenue-by-doctor": {
        by_doctor: [
          { profile_id: "d0", doctor_name: "Dr. Low", total: 100, invoice_count: 1 },
          { profile_id: "d1", doctor_name: "Dr. High", total: 9000, invoice_count: 9 },
          { profile_id: "d2", doctor_name: "Dr. B", total: 5000, invoice_count: 5 },
          { profile_id: "d3", doctor_name: "Dr. C", total: 4000, invoice_count: 4 },
          { profile_id: "d4", doctor_name: "Dr. D", total: 3000, invoice_count: 3 },
          { profile_id: "d5", doctor_name: "Dr. E", total: 2000, invoice_count: 2 },
        ],
        total: 23100,
      },
    });

    renderWithIntl(<ReportsPage />);

    // Highest earner shown; the lowest (6th after sorting) is sliced out,
    // while the genuine 5th (Dr. E) survives — proving sort + slice(0,5).
    expect(screen.getByText("Dr. High")).toBeInTheDocument();
    expect(screen.getByText("Dr. E")).toBeInTheDocument();
    expect(screen.queryByText("Dr. Low")).not.toBeInTheDocument();
  });

  it("renders the AR aging snapshot buckets and total", () => {
    mockReports({ revenue: REVENUE, "ar-aging": AR });

    renderWithIntl(<ReportsPage />);

    expect(screen.getByText("AR aging snapshot")).toBeInTheDocument();
    expect(screen.getByText("Current")).toBeInTheDocument();
    expect(screen.getByText("1–30 days")).toBeInTheDocument();
    expect(screen.getByText("90+ days")).toBeInTheDocument();
  });

  it("renders without crashing when every report is empty", () => {
    mockReports({});

    renderWithIntl(<ReportsPage />);

    expect(screen.getByText("Total invoiced")).toBeInTheDocument();
    expect(screen.getByText("0.0%")).toBeInTheDocument();
  });

  it("shows a share-% column on the By Method tab", () => {
    mockReports({
      revenue: REVENUE,
      "payments-by-method": {
        by_method: [
          { payment_method: "CASH", total: 6000, count: 30 },
          { payment_method: "CARD", total: 4000, count: 10 },
        ],
        total: 10000,
      },
    });

    renderWithIntl(<ReportsPage />);
    fireEvent.click(screen.getByRole("button", { name: "By Method" }));

    expect(screen.getByText("Share")).toBeInTheDocument();
    expect(screen.getByText("60.0%")).toBeInTheDocument(); // 6000 / 10000
  });
});
