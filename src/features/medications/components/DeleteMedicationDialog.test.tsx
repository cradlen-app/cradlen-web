import { screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { renderWithIntl } from "@/test/render";
import { DeleteMedicationDialog } from "./DeleteMedicationDialog";
import type { Medication } from "../types/medications.types";

const MED = { id: "m1", name: "Amoxicillin" } as unknown as Medication;

describe("DeleteMedicationDialog", () => {
  it("renders nothing when medication is null", () => {
    renderWithIntl(
      <DeleteMedicationDialog
        medication={null}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isPending={false}
      />,
    );
    expect(screen.queryByText(/Delete Amoxicillin/)).not.toBeInTheDocument();
  });

  it("renders the medication name in title + description when open", () => {
    renderWithIntl(
      <DeleteMedicationDialog
        medication={MED}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isPending={false}
      />,
    );
    expect(screen.getByText("Delete Amoxicillin?")).toBeInTheDocument();
    expect(
      screen.getByText(/This will remove Amoxicillin from your catalog/),
    ).toBeInTheDocument();
  });

  it("calls onConfirm when the destructive action is clicked", () => {
    const onConfirm = vi.fn();
    renderWithIntl(
      <DeleteMedicationDialog
        medication={MED}
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
        isPending={false}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("shows the pending label and disables the action while pending", () => {
    renderWithIntl(
      <DeleteMedicationDialog
        medication={MED}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isPending
      />,
    );
    const action = screen.getByRole("button", { name: "Deleting…" });
    expect(action).toBeDisabled();
  });
});
