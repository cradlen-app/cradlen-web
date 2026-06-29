import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/render";
import { VisitContextRail } from "./VisitContextRail";

describe("VisitContextRail", () => {
  it("renders the four placeholder sections with their empty states", () => {
    renderWithIntl(
      <VisitContextRail patientId="p-1" onNavigateToHistory={() => {}} />,
    );
    expect(screen.getByText("Red Flags")).toBeInTheDocument();
    expect(screen.getByText("Alerts")).toBeInTheDocument();
    expect(screen.getByText("Repeated Compliments")).toBeInTheDocument();
    expect(screen.getByText("Comments")).toBeInTheDocument();

    expect(
      screen.getByText(/no red flags yet for this patient/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/no active alerts/i)).toBeInTheDocument();
    expect(
      screen.getByText(/no comments on this visit yet/i),
    ).toBeInTheDocument();
  });
});
