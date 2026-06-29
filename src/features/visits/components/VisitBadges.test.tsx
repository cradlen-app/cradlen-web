import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/render";
import {
  VisitTypeBadge,
  VisitStatusBadge,
  VisitPriorityBadge,
} from "./VisitBadges";

describe("VisitBadges", () => {
  it("VisitTypeBadge renders translated labels per type", () => {
    renderWithIntl(<VisitTypeBadge type="FOLLOW_UP" />);
    // visits.type.followUp
    expect(screen.getByText(/follow/i)).toBeInTheDocument();
  });

  it("VisitStatusBadge renders a label and a status-specific style", () => {
    renderWithIntl(<VisitStatusBadge status="IN_CONSULTATION" />);
    const badge = screen.getByText(/consultation/i);
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("text-brand-primary");
  });

  it("VisitStatusBadge applies the completed style", () => {
    renderWithIntl(<VisitStatusBadge status="COMPLETED" />);
    const badge = screen.getByText(/completed/i);
    expect(badge.className).toContain("emerald");
  });

  it("VisitPriorityBadge renders the emergency style", () => {
    renderWithIntl(<VisitPriorityBadge priority="EMERGENCY" />);
    const badge = screen.getByText(/emergency/i);
    expect(badge.className).toContain("red");
  });

  it("VisitPriorityBadge renders the normal style", () => {
    renderWithIntl(<VisitPriorityBadge priority="NORMAL" />);
    expect(screen.getByText(/normal/i)).toBeInTheDocument();
  });
});
