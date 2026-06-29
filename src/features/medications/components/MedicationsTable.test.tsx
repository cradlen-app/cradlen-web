import { screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { renderWithIntl } from "@/test/render";
import { MedicationsTable } from "./MedicationsTable";
import type { Medication } from "../types/medications.types";

function makeMedication(overrides: Partial<Medication> = {}): Medication {
  return {
    id: "m1",
    organization_id: "org1",
    code: "AMX500",
    name: "Amoxicillin",
    generic_name: "Amoxicillin Trihydrate",
    form: "Tablet",
    strength: "500mg",
    category: "Antibiotic",
    company: "Acme",
    notes: "Take with food",
    default_dose_amount: 1,
    default_dose_unit: "tab",
    default_dose_frequency: "BID",
    default_dose_route: "PO",
    added_by_id: null,
    is_deleted: false,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
    total_prescriptions: 7,
    top_prescribers: [],
    medical_reps: [],
    ...overrides,
  };
}

describe("MedicationsTable", () => {
  it("renders a medication row with name, generic name and usage", () => {
    renderWithIntl(
      <MedicationsTable
        medications={[makeMedication()]}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Amoxicillin")).toBeInTheDocument();
    expect(screen.getByText("Amoxicillin Trihydrate")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    // formatDefaultDose joins amount+unit, frequency, route with " · ".
    expect(screen.getByText("1tab · BID · PO")).toBeInTheDocument();
  });

  it("renders an em dash for missing optional cells", () => {
    renderWithIntl(
      <MedicationsTable
        medications={[
          makeMedication({
            form: null,
            strength: null,
            category: null,
            generic_name: null,
            notes: null,
            default_dose_amount: null,
            default_dose_unit: null,
            default_dose_frequency: null,
            default_dose_route: null,
          }),
        ]}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    // Several cells fall back to "—".
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("shows the empty state when there are no medications", () => {
    renderWithIntl(
      <MedicationsTable
        medications={[]}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("No medications found")).toBeInTheDocument();
  });

  it("renders the skeleton while loading (no data rows)", () => {
    const { container } = renderWithIntl(
      <MedicationsTable
        medications={[makeMedication()]}
        isLoading
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    expect(screen.queryByText("Amoxicillin")).not.toBeInTheDocument();
  });

  it("invokes onEdit / onDelete with the row's medication", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const med = makeMedication();
    renderWithIntl(
      <MedicationsTable
        medications={[med]}
        isLoading={false}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit medication" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete medication" }));

    expect(onEdit).toHaveBeenCalledWith(med);
    expect(onDelete).toHaveBeenCalledWith(med);
  });
});
