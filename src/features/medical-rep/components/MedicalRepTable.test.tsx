import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";
import { MedicalRepTable } from "./MedicalRepTable";
import type { MedicalRep } from "../types/medical-rep.types";

function makeRep(over: Partial<MedicalRep> = {}): MedicalRep {
  return {
    id: "r1",
    full_name: "Sara Adel",
    company_name: "Pharma Co",
    national_id: null,
    phone_number: "0100",
    specialty_focus: null,
    products: ["Aspirin", "Paracetamol"],
    last_visit_date: "2026-06-01T00:00:00.000Z",
    visits_count: 4,
    ...over,
  };
}

describe("MedicalRepTable", () => {
  it("renders header columns and a rep row", () => {
    renderWithIntl(
      <MedicalRepTable reps={[makeRep()]} isLoading={false} />,
    );

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Phone")).toBeInTheDocument();
    expect(screen.getByText("Sara Adel")).toBeInTheDocument();
    expect(screen.getByText("Pharma Co")).toBeInTheDocument();
    // Products joined with a middot.
    expect(screen.getByText("Aspirin · Paracetamol")).toBeInTheDocument();
  });

  it("derives avatar initials from the full name", () => {
    renderWithIntl(
      <MedicalRepTable reps={[makeRep({ full_name: "Sara Adel" })]} isLoading={false} />,
    );

    expect(screen.getByText("SA")).toBeInTheDocument();
  });

  it("shows an em dash when there are no products", () => {
    renderWithIntl(
      <MedicalRepTable reps={[makeRep({ products: [] })]} isLoading={false} />,
    );

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders the empty state when there are no reps", () => {
    renderWithIntl(<MedicalRepTable reps={[]} isLoading={false} />);

    expect(screen.getByText("No medical reps found")).toBeInTheDocument();
  });

  it("renders a skeleton while loading", () => {
    const { container } = renderWithIntl(
      <MedicalRepTable reps={[]} isLoading={true} />,
    );

    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    expect(screen.queryByText("No medical reps found")).not.toBeInTheDocument();
  });

  it("calls onOpen on row double-click", () => {
    const onOpen = vi.fn();
    const rep = makeRep();
    renderWithIntl(
      <MedicalRepTable reps={[rep]} isLoading={false} onOpen={onOpen} />,
    );

    fireEvent.doubleClick(screen.getByText("Sara Adel"));

    expect(onOpen).toHaveBeenCalledWith(rep);
  });
});
