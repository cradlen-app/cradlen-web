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

import { DashboardTopPerformers } from "./DashboardTopPerformers";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DashboardTopPerformers", () => {
  it("renders both section titles", () => {
    useFinancialReport.mockReturnValue({ data: undefined });
    renderWithIntl(<DashboardTopPerformers orgWide={false} />);
    expect(screen.getByText("Top doctors")).toBeInTheDocument();
    expect(screen.getByText("Top services")).toBeInTheDocument();
  });

  it("renders ranked rows sorted by revenue", () => {
    useFinancialReport.mockImplementation((slug: string) => {
      if (slug === "revenue-by-doctor") {
        return {
          data: {
            by_doctor: [
              { doctor_name: "Dr. Mona", total: "2000" },
              { doctor_name: "Dr. Adel", total: "9000" },
            ],
          },
        };
      }
      return {
        data: {
          by_service: [{ service_name: "Ultrasound", total: "1500" }],
        },
      };
    });
    renderWithIntl(<DashboardTopPerformers orgWide={false} />);
    expect(screen.getByText("Dr. Adel")).toBeInTheDocument();
    expect(screen.getByText("EGP 9,000.00")).toBeInTheDocument();
    expect(screen.getByText("Ultrasound")).toBeInTheDocument();
    expect(screen.getByText("EGP 1,500.00")).toBeInTheDocument();
  });

  it("renders empty labels when reports return no rows", () => {
    useFinancialReport.mockReturnValue({ data: { by_doctor: [], by_service: [] } });
    renderWithIntl(<DashboardTopPerformers orgWide />);
    expect(screen.getAllByText("No data yet")).toHaveLength(2);
  });
});
