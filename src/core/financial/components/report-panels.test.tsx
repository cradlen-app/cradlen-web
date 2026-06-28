import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";

const { useFinancialReportMock } = vi.hoisted(() => ({
  useFinancialReportMock: vi.fn(),
}));

vi.mock("../hooks/useReports", () => ({
  useFinancialReport: (name: string, params?: unknown, options?: unknown) =>
    useFinancialReportMock(name, params, options),
}));

// recharts renders inside a zero-size ResponsiveContainer under jsdom; the
// panel bodies (tables, totals) are what we assert on.
import {
  ArAgingPanel,
  ByBranchPanel,
  ByDoctorPanel,
  ByMethodPanel,
  ByServicePanel,
  CollectionsPanel,
  DailyPanel,
  OutstandingPanel,
  OverviewPanel,
  SummaryPanel,
} from "./report-panels";

const PARAMS = { date_from: "2026-01-01", date_to: "2026-01-31" } as never;

/** Drive useFinancialReport(name) from a name→data map. */
function driveFromMap(map: Record<string, unknown>, loading = false) {
  useFinancialReportMock.mockImplementation((name: string) => ({
    data: map[name] ?? null,
    isLoading: loading,
  }));
}

const arAging = {
  buckets: { current: "100", d1_30: "50", d31_60: "20", d61_90: "10", d90_plus: "5" },
  total_outstanding: "185",
};

beforeEach(() => {
  vi.clearAllMocks();
  useFinancialReportMock.mockReturnValue({ data: null, isLoading: false });
});

describe("OverviewPanel", () => {
  it("renders KPIs, trend, rankings and AR snapshot with full data", () => {
    driveFromMap({
      revenue: {
        total_invoiced: "1000",
        total_collected: "750",
        outstanding: "250",
      },
      "daily-revenue": {
        rows: [{ date: "2026-01-01", invoiced: "500", collected: "400" }],
      },
      "revenue-by-doctor": {
        by_doctor: [{ doctor_name: "Dr A", total: "600" }],
      },
      "revenue-by-service": {
        by_service: [{ service_name: "Consult", total: "400" }],
      },
      "ar-aging": arAging,
      "revenue-by-branch": {
        by_branch: [{ branch_name: "Main", billed: "900" }],
      },
    });

    renderWithIntl(
      <OverviewPanel params={PARAMS} showBranchAnalytics ownScope={false} />,
    );

    expect(screen.getByText("Dr A")).toBeInTheDocument();
    expect(screen.getByText("Consult")).toBeInTheDocument();
    expect(screen.getByText("Main")).toBeInTheDocument();
  });

  it("hides doctor + branch breakdowns in own-scope mode", () => {
    driveFromMap({
      revenue: { total_invoiced: "0", total_collected: "0", outstanding: "0" },
      "revenue-by-service": { by_service: [{ service_name: "Consult", total: "5" }] },
      "ar-aging": null,
    });
    renderWithIntl(
      <OverviewPanel params={PARAMS} showBranchAnalytics={false} ownScope />,
    );
    expect(screen.queryByText("Dr A")).not.toBeInTheDocument();
    expect(screen.getByText("Consult")).toBeInTheDocument();
  });

  it("shows the KPI skeleton and section loaders while loading", () => {
    driveFromMap({}, true);
    renderWithIntl(
      <OverviewPanel params={PARAMS} showBranchAnalytics ownScope={false} />,
    );
    // Loading copy is rendered for each section.
    expect(screen.getAllByText("Loading report…").length).toBeGreaterThan(0);
  });
});

describe("standalone report panels", () => {
  it("ArAgingPanel renders buckets and grand total", () => {
    useFinancialReportMock.mockReturnValue({ data: arAging, isLoading: false });
    renderWithIntl(<ArAgingPanel params={PARAMS} />);
    expect(screen.getByText(/Total/i)).toBeInTheDocument();
  });

  it("ArAgingPanel shows loading then empty", () => {
    useFinancialReportMock.mockReturnValue({ data: null, isLoading: true });
    const loading = renderWithIntl(<ArAgingPanel params={PARAMS} />);
    expect(screen.getByText("Loading report…")).toBeInTheDocument();
    loading.unmount();
    useFinancialReportMock.mockReturnValue({ data: null, isLoading: false });
    renderWithIntl(<ArAgingPanel params={PARAMS} />);
    expect(screen.getByText("No data for this period.")).toBeInTheDocument();
  });

  it("CollectionsPanel renders method + staff tables", () => {
    useFinancialReportMock.mockReturnValue({
      data: {
        total: "300",
        by_method: [{ payment_method: "CASH", total: "200", count: 2 }],
        by_staff: [{ staff_name: "Reception A", total: "100", count: 1 }],
      },
      isLoading: false,
    });
    renderWithIntl(<CollectionsPanel params={PARAMS} />);
    expect(screen.getByText("Reception A")).toBeInTheDocument();
  });

  it("CollectionsPanel is empty when both groupings are empty", () => {
    useFinancialReportMock.mockReturnValue({
      data: { total: "0", by_method: [], by_staff: [] },
      isLoading: false,
    });
    renderWithIntl(<CollectionsPanel params={PARAMS} />);
    expect(screen.getByText("No data for this period.")).toBeInTheDocument();
  });

  it("SummaryPanel renders scalar entries and array tables", () => {
    useFinancialReportMock.mockReturnValue({
      data: {
        total_revenue: "1234",
        label: "Quarterly",
        rows: [{ name: "Item", amount: "10" }],
        empties: [],
      },
      isLoading: false,
    });
    renderWithIntl(<SummaryPanel name="custom" params={PARAMS} />);
    expect(screen.getByText("Quarterly")).toBeInTheDocument();
    expect(screen.getByText("Item")).toBeInTheDocument();
  });

  it("SummaryPanel is empty for an empty object", () => {
    useFinancialReportMock.mockReturnValue({ data: {}, isLoading: false });
    renderWithIntl(<SummaryPanel name="custom" params={PARAMS} />);
    expect(screen.getByText("No data for this period.")).toBeInTheDocument();
  });

  it("DailyPanel renders a chart from rows and is empty otherwise", () => {
    useFinancialReportMock.mockReturnValue({
      data: { rows: [{ date: "2026-01-01", invoiced: "5", collected: "3" }] },
      isLoading: false,
    });
    const withRows = renderWithIntl(<DailyPanel params={PARAMS} />);
    withRows.unmount();
    useFinancialReportMock.mockReturnValue({
      data: { rows: [] },
      isLoading: false,
    });
    renderWithIntl(<DailyPanel params={PARAMS} />);
    expect(screen.getByText("No data for this period.")).toBeInTheDocument();
  });

  it("ByServicePanel + ByDoctorPanel render their tables", () => {
    useFinancialReportMock.mockReturnValue({
      data: {
        total: "400",
        by_service: [{ service_name: "Consult", total: "400", line_count: 4 }],
      },
      isLoading: false,
    });
    const svc = renderWithIntl(<ByServicePanel params={PARAMS} />);
    expect(screen.getByText("Consult")).toBeInTheDocument();
    svc.unmount();

    useFinancialReportMock.mockReturnValue({
      data: {
        total: "600",
        by_doctor: [{ doctor_name: "Dr B", total: "600", invoice_count: 3 }],
      },
      isLoading: false,
    });
    renderWithIntl(<ByDoctorPanel params={PARAMS} />);
    expect(screen.getByText("Dr B")).toBeInTheDocument();
  });

  it("ByBranchPanel renders a sorted branch table", () => {
    useFinancialReportMock.mockReturnValue({
      data: {
        total: "1000",
        by_branch: [
          {
            branch_name: "Main",
            invoice_count: 5,
            billed: "900",
            collected: "700",
            outstanding: "200",
          },
          {
            branch_name: "Annex",
            invoice_count: 8,
            billed: "100",
            collected: "100",
            outstanding: "0",
          },
        ],
      },
      isLoading: false,
    });
    renderWithIntl(<ByBranchPanel params={PARAMS} />);
    expect(screen.getByText("Main")).toBeInTheDocument();
    expect(screen.getByText("Annex")).toBeInTheDocument();
  });

  it("ByMethodPanel renders a pie + share table", () => {
    useFinancialReportMock.mockReturnValue({
      data: {
        total: "300",
        by_method: [
          { payment_method: "CASH", total: "200", count: 2 },
          { payment_method: "CARD", total: "100", count: 1 },
        ],
      },
      isLoading: false,
    });
    renderWithIntl(<ByMethodPanel params={PARAMS} />);
    // Two methods rendered in the share table.
    expect(screen.getAllByText(/Cash|CASH/).length).toBeGreaterThan(0);
  });

  it("ByMethodPanel handles a zero grand total without dividing by zero", () => {
    useFinancialReportMock.mockReturnValue({
      data: {
        total: "0",
        by_method: [{ payment_method: "CASH", total: "0", count: 0 }],
      },
      isLoading: false,
    });
    renderWithIntl(<ByMethodPanel params={PARAMS} />);
    expect(screen.getByText("0.0%")).toBeInTheDocument();
  });

  it("OutstandingPanel renders invoice rows incl. a missing doctor", () => {
    useFinancialReportMock.mockReturnValue({
      data: {
        total_outstanding: "500",
        invoices: [
          {
            id: "inv-1",
            invoice_number: "INV-001",
            patient_name: "Jane",
            doctor_name: null,
            status: "ISSUED",
            balance_due: "500",
            last_payment_date: null,
            age_days: 12,
          },
        ],
      },
      isLoading: false,
    });
    renderWithIntl(<OutstandingPanel params={PARAMS} />);
    expect(screen.getByText("INV-001")).toBeInTheDocument();
    expect(screen.getByText("Jane")).toBeInTheDocument();
  });

  it("OutstandingPanel is empty without invoices", () => {
    useFinancialReportMock.mockReturnValue({
      data: { total_outstanding: "0", invoices: [] },
      isLoading: false,
    });
    renderWithIntl(<OutstandingPanel params={PARAMS} />);
    expect(screen.getByText("No data for this period.")).toBeInTheDocument();
  });
});
