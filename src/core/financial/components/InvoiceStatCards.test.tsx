import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";

const { useFinancialReportMock } = vi.hoisted(() => ({
  useFinancialReportMock: vi.fn(),
}));

vi.mock("../hooks/useReports", () => ({
  useFinancialReport: (name: string, params?: unknown) =>
    useFinancialReportMock(name, params),
}));

vi.mock("@/features/auth/store/authContextStore", () => ({
  useAuthContextStore: (sel: (s: { branchId: string }) => unknown) =>
    sel({ branchId: "br-1" }),
}));

import { InvoiceStatCards } from "./InvoiceStatCards";

const STATS = {
  paid: { count: 4, amount: "1000" },
  unpaid: { count: 2, amount: "500" },
  pending: { count: 1, amount: "250" },
  overdue: { count: 3, amount: "750" },
};

describe("InvoiceStatCards", () => {
  beforeEach(() => useFinancialReportMock.mockReset());

  it("renders a skeleton while the report is loading", () => {
    useFinancialReportMock.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = renderWithIntl(<InvoiceStatCards />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    expect(screen.queryByText("Paid Invoices")).not.toBeInTheDocument();
  });

  it("renders each status bucket with its amount and invoice count", () => {
    useFinancialReportMock.mockReturnValue({ data: STATS, isLoading: false });
    renderWithIntl(<InvoiceStatCards />);

    expect(screen.getByText("Paid Invoices")).toBeInTheDocument();
    expect(screen.getByText("EGP 1,000.00")).toBeInTheDocument();
    expect(screen.getByText("Overdue Invoices")).toBeInTheDocument();
    expect(screen.getByText("from 3 invoices")).toBeInTheDocument();
  });

  it("scopes the report query to the active branch", () => {
    useFinancialReportMock.mockReturnValue({ data: STATS, isLoading: false });
    renderWithIntl(<InvoiceStatCards />);
    expect(useFinancialReportMock).toHaveBeenCalledWith("invoice-stats", {
      branch_id: "br-1",
    });
  });
});
