import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/render";

// Stub every child so this test owns only PatientOverview's composition +
// OB/GYN conditional logic.
vi.mock("./PatientSummaryCard", () => ({
  PatientSummaryCard: () => <div data-testid="summary" />,
}));
vi.mock("./PatientAttachmentsCard", () => ({
  PatientAttachmentsCard: () => <div data-testid="attachments" />,
}));
vi.mock("./VisitChartsPanel", () => ({
  VisitChartsPanel: () => <div data-testid="charts" />,
}));
vi.mock("./VisitsHistoryList", () => ({
  VisitsHistoryList: () => <div data-testid="history" />,
}));
vi.mock("./ObgynHistorySummaryCard", () => ({
  ObgynHistorySummaryCard: () => <div data-testid="obgyn-summary" />,
}));
vi.mock("./CurrentJourneySummaryCard", () => ({
  CurrentJourneySummaryCard: () => <div data-testid="journey-summary" />,
}));

import { PatientOverview } from "./PatientOverview";

describe("PatientOverview", () => {
  it("always renders the summary, attachments and visits history", () => {
    renderWithIntl(
      <PatientOverview patientId="p-1" excludeVisitId="" specialtyCode="PEDIATRICS" />,
    );
    expect(screen.getByTestId("summary")).toBeInTheDocument();
    expect(screen.getByTestId("attachments")).toBeInTheDocument();
    expect(screen.getByTestId("history")).toBeInTheDocument();
  });

  it("omits OB/GYN-only panels for a non-OBGYN specialty", () => {
    renderWithIntl(
      <PatientOverview patientId="p-1" excludeVisitId="" specialtyCode="PEDIATRICS" />,
    );
    expect(screen.queryByTestId("obgyn-summary")).toBeNull();
    expect(screen.queryByTestId("journey-summary")).toBeNull();
    expect(screen.queryByTestId("charts")).toBeNull();
  });

  it("renders OB/GYN summary, journey and charts for an OBGYN specialty", () => {
    renderWithIntl(
      <PatientOverview patientId="p-1" excludeVisitId="" specialtyCode="OBGYN" />,
    );
    expect(screen.getByTestId("obgyn-summary")).toBeInTheDocument();
    expect(screen.getByTestId("journey-summary")).toBeInTheDocument();
    expect(screen.getByTestId("charts")).toBeInTheDocument();
  });
});
