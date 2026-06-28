import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";

import { renderWithIntl } from "@/test/render";
import type { ApiJourneyTimelineEntry } from "../../../types/visits.api.types";

const mockTimeline = vi.fn();
vi.mock("../../../hooks/usePatientJourneyTimeline", () => ({
  usePatientJourneyTimeline: () => mockTimeline(),
}));

// The details dialog pulls in a large dependency graph (visit + journey
// queries); stub it — this list only owns opening/closing it.
vi.mock("./VisitDetailsDialog", () => ({
  VisitDetailsDialog: ({ open }: { open: boolean }) => (
    <div data-testid="details-dialog" data-open={open} />
  ),
}));

import { VisitsHistoryList } from "./VisitsHistoryList";

function journey(over: Partial<ApiJourneyTimelineEntry> = {}): ApiJourneyTimelineEntry {
  return {
    id: "j-1",
    name: "Pregnancy",
    type: "PREGNANCY",
    status: "ACTIVE",
    started_at: "2026-01-01T00:00:00.000Z",
    ended_at: null,
    episodes: [
      {
        id: "e-1",
        name: "Second Trimester",
        order: 2,
        status: "ACTIVE",
        started_at: "2026-02-01T00:00:00.000Z",
        ended_at: null,
        visits: [
          {
            id: "v-1",
            appointment_type: "VISIT",
            completed_at: "2026-03-12T00:00:00.000Z",
            diagnosis: "Healthy pregnancy",
            medications: [{ name: "Folic Acid", dose: "5mg" }],
            investigations: ["Ultrasound"],
          },
        ],
      },
    ],
    ...over,
  };
}

function baseReturn(over: Record<string, unknown> = {}) {
  return {
    journeys: [],
    isLoading: false,
    isLoadingMore: false,
    hasMore: false,
    loadMore: vi.fn(),
    ...over,
  };
}

describe("VisitsHistoryList", () => {
  beforeEach(() => {
    mockTimeline.mockReset();
  });

  it("shows the skeleton while loading", () => {
    mockTimeline.mockReturnValue(baseReturn({ isLoading: true }));
    const { container } = renderWithIntl(
      <VisitsHistoryList patientId="p-1" excludeVisitId="v-current" />,
    );
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("shows the empty state when there are no journeys", () => {
    mockTimeline.mockReturnValue(baseReturn());
    renderWithIntl(
      <VisitsHistoryList patientId="p-1" excludeVisitId="v-current" />,
    );
    // visits.workspace.history.empty → "No previous visits found."
    expect(screen.getByText(/no previous visits/i)).toBeInTheDocument();
  });

  it("renders journey, episode and visit details for the seeded (active) group", () => {
    mockTimeline.mockReturnValue(baseReturn({ journeys: [journey()] }));
    renderWithIntl(
      <VisitsHistoryList patientId="p-1" excludeVisitId="v-current" />,
    );
    expect(screen.getByText("Pregnancy")).toBeInTheDocument();
    expect(screen.getByText("Second Trimester")).toBeInTheDocument();
    // The active journey + latest episode are expanded by default, so the
    // visit card content is visible.
    expect(screen.getByText("Healthy pregnancy")).toBeInTheDocument();
    expect(screen.getByText("Folic Acid 5mg")).toBeInTheDocument();
    expect(screen.getByText("Ultrasound")).toBeInTheDocument();
  });

  it("renders a load-more button and calls loadMore on click", () => {
    const loadMore = vi.fn();
    mockTimeline.mockReturnValue(
      baseReturn({ journeys: [journey()], hasMore: true, loadMore }),
    );
    renderWithIntl(
      <VisitsHistoryList patientId="p-1" excludeVisitId="v-current" />,
    );
    // visits.workspace.history.loadMore
    const btn = screen.getByRole("button", { name: /load more/i });
    fireEvent.click(btn);
    expect(loadMore).toHaveBeenCalledTimes(1);
  });

  it("disables the load-more button while fetching the next page", () => {
    mockTimeline.mockReturnValue(
      baseReturn({ journeys: [journey()], hasMore: true, isLoadingMore: true }),
    );
    renderWithIntl(
      <VisitsHistoryList patientId="p-1" excludeVisitId="v-current" />,
    );
    const btn = screen.getByRole("button", { name: /loading/i });
    expect(btn).toBeDisabled();
  });

  it("mounts the details dialog closed by default", () => {
    mockTimeline.mockReturnValue(baseReturn({ journeys: [journey()] }));
    renderWithIntl(
      <VisitsHistoryList patientId="p-1" excludeVisitId="v-current" />,
    );
    expect(screen.getByTestId("details-dialog").dataset.open).toBe("false");
  });
});
