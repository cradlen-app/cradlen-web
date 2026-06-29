import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render";

const useFinancialReport = vi.fn();

vi.mock("@/core/financial", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/core/financial")>();
  return {
    ...actual,
    useFinancialReport: (slug: string, ...rest: unknown[]) =>
      useFinancialReport(slug, ...rest),
  };
});

vi.mock("@/hooks/useDashboardPath", () => ({
  useDashboardPath: () => (path: string) => `/org/branch/dashboard${path}`,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { DashboardFinancialOverview } from "./DashboardFinancialOverview";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DashboardFinancialOverview", () => {
  it("renders the financial KPI tiles with formatted money and rate", () => {
    useFinancialReport.mockImplementation((slug: string) => {
      if (slug === "revenue") {
        return {
          data: {
            total_invoiced: "1000",
            total_collected: "750",
            outstanding: "250",
          },
          isLoading: false,
        };
      }
      return { data: { rows: [] }, isLoading: false };
    });
    renderWithIntl(<DashboardFinancialOverview orgWide={false} />);

    expect(screen.getByText("Financial overview")).toBeInTheDocument();
    expect(screen.getByText("Invoiced")).toBeInTheDocument();
    expect(screen.getByText("EGP 1,000.00")).toBeInTheDocument();
    expect(screen.getByText("EGP 750.00")).toBeInTheDocument();
    expect(screen.getByText("EGP 250.00")).toBeInTheDocument();
    // collected / invoiced = 75.0%
    expect(screen.getByText("75.0%")).toBeInTheDocument();
  });

  it("renders the empty state when there is no daily trend data", () => {
    useFinancialReport.mockImplementation((slug: string) => {
      if (slug === "revenue") {
        return { data: { total_invoiced: "0" }, isLoading: false };
      }
      return { data: { rows: [] }, isLoading: false };
    });
    renderWithIntl(<DashboardFinancialOverview orgWide />);
    expect(screen.getByText("No data yet")).toBeInTheDocument();
  });

  it("links to the full financial reports page", () => {
    useFinancialReport.mockReturnValue({ data: { rows: [] }, isLoading: false });
    renderWithIntl(<DashboardFinancialOverview orgWide={false} />);
    const link = screen.getByRole("link", { name: /View full reports/ });
    expect(link).toHaveAttribute(
      "href",
      "/org/branch/dashboard/financial/reports",
    );
  });
});
