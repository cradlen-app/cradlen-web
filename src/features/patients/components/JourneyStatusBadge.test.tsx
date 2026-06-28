import { screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { renderWithIntl } from "@/test/render";
import { JourneyStatusBadge } from "./JourneyStatusBadge";
import { PatientsHeader } from "./PatientsHeader";

describe("JourneyStatusBadge", () => {
  it("renders the translated label for a known status", () => {
    renderWithIntl(<JourneyStatusBadge status="ACTIVE" />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("applies the status-specific style class", () => {
    renderWithIntl(<JourneyStatusBadge status="CANCELLED" />);
    const badge = screen.getByText("Cancelled");
    expect(badge.className).toContain("text-red-600");
  });

  it("renders an unknown status with the neutral fallback style", () => {
    renderWithIntl(<JourneyStatusBadge status="WEIRD_STATUS" />);
    // next-intl returns a fallback string for the missing key; the label still
    // surfaces the raw status, and the style falls back to the gray default.
    const badge = screen.getByText(/WEIRD_STATUS/);
    expect(badge.className).toContain("bg-gray-100");
  });
});

describe("PatientsHeader", () => {
  it("renders the page title", () => {
    renderWithIntl(<PatientsHeader />);
    expect(
      screen.getByRole("heading", { name: "Patients" }),
    ).toBeInTheDocument();
  });
});
