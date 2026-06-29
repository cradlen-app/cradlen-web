import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithIntl } from "@/test/render";
import { RepSummaryCard, type RepOverview } from "./RepSummaryCard";

function makeOverview(over: Partial<RepOverview> = {}): RepOverview {
  return {
    full_name: "Sara Adel",
    company_name: "Pharma Co",
    phone_number: "0100",
    specialty_focus: null,
    last_visit_at: null,
    promoted_medications: ["Aspirin"],
    ...over,
  };
}

describe("RepSummaryCard", () => {
  it("renders the rep name, handle, and contact rows", () => {
    renderWithIntl(<RepSummaryCard overview={makeOverview()} />);

    expect(screen.getByText("Sara Adel")).toBeInTheDocument();
    expect(screen.getByText("@sara_adel")).toBeInTheDocument();
    expect(screen.getByText("Pharma Co")).toBeInTheDocument();
    expect(screen.getByText("0100")).toBeInTheDocument();
  });

  it("resolves the specialty focus code to its display name", () => {
    renderWithIntl(
      <RepSummaryCard
        overview={makeOverview({ specialty_focus: "CARD" })}
        specialties={[{ code: "CARD", name: "Cardiology" }]}
      />,
    );

    expect(screen.getByText("Cardiology")).toBeInTheDocument();
  });

  it("falls back to the raw code when no specialty matches", () => {
    renderWithIntl(
      <RepSummaryCard
        overview={makeOverview({ specialty_focus: "XYZ" })}
        specialties={[]}
      />,
    );

    expect(screen.getByText("XYZ")).toBeInTheDocument();
  });

  it("lists promoted medications as chips", () => {
    renderWithIntl(
      <RepSummaryCard
        overview={makeOverview({ promoted_medications: ["Aspirin", "Ibuprofen"] })}
      />,
    );

    expect(screen.getByText("Aspirin")).toBeInTheDocument();
    expect(screen.getByText("Ibuprofen")).toBeInTheDocument();
  });
});
