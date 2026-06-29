import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/render";

const mockVisit = vi.fn();
const mockJourney = vi.fn();
vi.mock("../../../hooks/useVisit", () => ({
  useVisit: (id: string) => mockVisit(id),
}));
vi.mock("@/features/journeys/lib/useVisitJourney", () => ({
  useVisitJourney: (id: string) => mockJourney(id),
}));
vi.mock("../tabs/ExaminationTab", () => ({
  ExaminationTab: ({ readOnly }: { readOnly?: boolean }) => (
    <div data-testid="examination-tab" data-readonly={String(!!readOnly)} />
  ),
}));
vi.mock("@/features/journeys/components/JourneyClinicalTab", () => ({
  JourneyClinicalTab: () => <div data-testid="journey-tab" />,
}));

import { VisitDetailsDialog } from "./VisitDetailsDialog";

const visit = {
  id: "v-1",
  type: "VISIT",
  completedAt: "2026-03-12T00:00:00.000Z",
};

describe("VisitDetailsDialog", () => {
  beforeEach(() => {
    mockVisit.mockReset();
    mockJourney.mockReset();
    mockJourney.mockReturnValue({ data: null });
  });

  it("renders nothing when closed", () => {
    mockVisit.mockReturnValue({ data: visit, isLoading: false });
    renderWithIntl(
      <VisitDetailsDialog open={false} onOpenChange={() => {}} visitId="v-1" />,
    );
    expect(screen.queryByText("Visit Details")).toBeNull();
  });

  it("renders the loading state while the visit query resolves", () => {
    mockVisit.mockReturnValue({ data: null, isLoading: true });
    renderWithIntl(
      <VisitDetailsDialog open onOpenChange={() => {}} visitId="v-1" />,
    );
    // Title + sr-only description both carry the label while loading.
    expect(screen.getAllByText("Visit Details").length).toBeGreaterThan(0);
    // examination.workspace.loading
    expect(screen.getByText("Loading examination…")).toBeInTheDocument();
  });

  it("renders the error state when no visit resolves", () => {
    mockVisit.mockReturnValue({ data: null, isLoading: false });
    renderWithIntl(
      <VisitDetailsDialog open onOpenChange={() => {}} visitId="v-1" />,
    );
    expect(screen.getByText("Could not load examination.")).toBeInTheDocument();
  });

  it("renders the read-only examination tab only when no clinical surface", () => {
    mockVisit.mockReturnValue({ data: visit, isLoading: false });
    mockJourney.mockReturnValue({ data: null });
    renderWithIntl(
      <VisitDetailsDialog open onOpenChange={() => {}} visitId="v-1" />,
    );
    const exam = screen.getByTestId("examination-tab");
    expect(exam).toHaveAttribute("data-readonly", "true");
    expect(screen.queryByTestId("journey-tab")).toBeNull();
  });

  it("renders both examination and journey tabs when a clinical surface exists", () => {
    mockVisit.mockReturnValue({ data: visit, isLoading: false });
    mockJourney.mockReturnValue({
      data: {
        journey_id: "j-1",
        clinical_surface: { label: "Pregnancy" },
      },
    });
    renderWithIntl(
      <VisitDetailsDialog open onOpenChange={() => {}} visitId="v-1" />,
    );
    expect(screen.getByRole("tab", { name: "Examination" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Pregnancy" })).toBeInTheDocument();
  });
});
