import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/render";
import type { ObgynHistorySummary } from "@/features/patient-history/api/obgyn-history-summary.api";

const mockSummary = vi.fn();
vi.mock("@/features/patient-history/api/useObgynHistorySummary", () => ({
  useObgynHistorySummary: (id: string) => mockSummary(id),
}));

import { ObgynHistorySummaryCard } from "./ObgynHistorySummaryCard";

function data(over: Partial<ObgynHistorySummary> = {}): ObgynHistorySummary {
  return {
    history_exists: true,
    identifier: {
      gtpal_label: "G2P1",
      lmp: "2026-01-01",
      blood_group_rh: "O+",
    },
    flags: [{ label: "Anemia", severity: "medium" }],
    sections: [
      { code: "ob", label: "Obstetric", status: "positive", items: ["G2P1"] },
      {
        code: "gyn",
        label: "Gynae",
        status: "negative",
        items: ["No issues"],
      },
    ],
    ...over,
  } as ObgynHistorySummary;
}

describe("ObgynHistorySummaryCard", () => {
  beforeEach(() => mockSummary.mockReset());

  it("always renders the section title", () => {
    mockSummary.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    renderWithIntl(<ObgynHistorySummaryCard patientId="p-1" />);
    expect(screen.getByText("OB/GYN History Summary")).toBeInTheDocument();
  });

  it("shows the skeleton while loading", () => {
    mockSummary.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    const { container } = renderWithIntl(
      <ObgynHistorySummaryCard patientId="p-1" />,
    );
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("renders the no-history message on error", () => {
    mockSummary.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    renderWithIntl(<ObgynHistorySummaryCard patientId="p-1" />);
    expect(screen.getByText(/no history recorded yet/i)).toBeInTheDocument();
  });

  it("renders the no-history message when history does not exist", () => {
    mockSummary.mockReturnValue({
      data: data({ history_exists: false }),
      isLoading: false,
      isError: false,
    });
    renderWithIntl(<ObgynHistorySummaryCard patientId="p-1" />);
    expect(screen.getByText(/no history recorded yet/i)).toBeInTheDocument();
  });

  it("renders the summary header, flags and sections when data exists", () => {
    mockSummary.mockReturnValue({
      data: data(),
      isLoading: false,
      isError: false,
    });
    renderWithIntl(<ObgynHistorySummaryCard patientId="p-1" />);
    expect(screen.getByText(/G2P1 • LMP 2026-01-01 • O\+/)).toBeInTheDocument();
    expect(screen.getByText("Anemia")).toBeInTheDocument();
    expect(screen.getByText("Obstetric:")).toBeInTheDocument();
    expect(screen.getByText("Gynae:")).toBeInTheDocument();
  });
});
