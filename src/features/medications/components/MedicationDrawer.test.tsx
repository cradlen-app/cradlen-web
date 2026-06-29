import { screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { renderWithIntl } from "@/test/render";
import { MedicationDrawer } from "./MedicationDrawer";
import type { Medication } from "../types/medications.types";

const { useMedicalRepsMock } = vi.hoisted(() => ({
  useMedicalRepsMock: vi.fn(),
}));

vi.mock("@/features/medical-rep/hooks/useMedicalReps", () => ({
  useMedicalReps: (...args: unknown[]) => useMedicalRepsMock(...args),
}));

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
    notes: "note",
    default_dose_amount: 2,
    default_dose_unit: "tab",
    default_dose_frequency: "BID",
    default_dose_route: "PO",
    added_by_id: null,
    is_deleted: false,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
    total_prescriptions: 3,
    top_prescribers: [],
    medical_reps: [
      { id: "rep1", full_name: "Rep One", company_name: "Pharma Co" },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  useMedicalRepsMock.mockReturnValue({
    data: {
      data: [
        { id: "rep2", full_name: "Rep Two", company_name: "Other Co" },
      ],
    },
  });
});

describe("MedicationDrawer", () => {
  it("renders the add title and an empty name field in create mode", () => {
    renderWithIntl(
      <MedicationDrawer
        open
        onOpenChange={vi.fn()}
        medication={null}
        onSubmit={vi.fn()}
        isPending={false}
      />,
    );
    expect(screen.getByText("New Medicine")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("e.g. Amoxicillin"),
    ).toHaveValue("");
  });

  it("blocks submission and shows a validation error when the name is empty", async () => {
    const onSubmit = vi.fn();
    renderWithIntl(
      <MedicationDrawer
        open
        onOpenChange={vi.fn()}
        medication={null}
        onSubmit={onSubmit}
        isPending={false}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits the typed values (with an auto-generated code) in create mode", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderWithIntl(
      <MedicationDrawer
        open
        onOpenChange={vi.fn()}
        medication={null}
        onSubmit={onSubmit}
        isPending={false}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText("e.g. Amoxicillin"), {
      target: { value: "Amoxicillin" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Amoxicillin", code: "AMX" }),
    );
  });

  it("hydrates fields from the medication in edit mode", () => {
    renderWithIntl(
      <MedicationDrawer
        open
        onOpenChange={vi.fn()}
        medication={makeMedication()}
        onSubmit={vi.fn()}
        isPending={false}
      />,
    );
    expect(screen.getByText("Edit Medicine")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Amoxicillin")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Amoxicillin Trihydrate")).toBeInTheDocument();
  });

  it("keeps the linked rep in the dropdown even when it is outside the first page", () => {
    renderWithIntl(
      <MedicationDrawer
        open
        onOpenChange={vi.fn()}
        medication={makeMedication()}
        onSubmit={vi.fn()}
        isPending={false}
      />,
    );
    // rep1 is the linked rep (not in the fetched page) and rep2 is from the page.
    expect(screen.getByRole("option", { name: /Rep One/ })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Rep Two/ })).toBeInTheDocument();
  });

  it("submits edits including the linked medical rep id", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderWithIntl(
      <MedicationDrawer
        open
        onOpenChange={vi.fn()}
        medication={makeMedication()}
        onSubmit={onSubmit}
        isPending={false}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Amoxicillin", medicalRepId: "rep1" }),
    );
  });

  it("disables the submit button while pending", () => {
    renderWithIntl(
      <MedicationDrawer
        open
        onOpenChange={vi.fn()}
        medication={null}
        onSubmit={vi.fn()}
        isPending
      />,
    );
    expect(screen.getByRole("button", { name: "…" })).toBeDisabled();
  });
});
