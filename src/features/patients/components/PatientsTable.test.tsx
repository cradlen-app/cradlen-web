import { screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { renderWithIntl } from "@/test/render";
import { PatientsTable } from "./PatientsTable";
import type { Patient } from "@/features/visits/types/visits.types";

function makePatient(overrides: Partial<Patient> = {}): Patient {
  return {
    id: "p1",
    fullName: "Jane Doe",
    phoneNumber: "0100000000",
    address: "12 Nile St",
    lastVisitDate: "2026-01-10",
    journeyType: "PREGNANCY",
    journeyStatus: "ACTIVE",
    imageUrl: null,
    ...overrides,
  };
}

describe("PatientsTable", () => {
  it("renders patient rows with translated journey type and status", () => {
    renderWithIntl(
      <PatientsTable
        patients={[makePatient()]}
        selectedId={null}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("0100000000")).toBeInTheDocument();
    expect(screen.getByText("12 Nile St")).toBeInTheDocument();
    // journeyType.PREGNANCY → "Pregnancy"; status badge → "Active".
    expect(screen.getByText("Pregnancy")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders the avatar initial when there is no image", () => {
    renderWithIntl(
      <PatientsTable
        patients={[makePatient({ fullName: "Omar" })]}
        selectedId={null}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText("O")).toBeInTheDocument();
  });

  it("falls back to em dashes for missing phone / address / journey", () => {
    renderWithIntl(
      <PatientsTable
        patients={[
          makePatient({
            phoneNumber: undefined,
            address: undefined,
            journeyType: undefined,
            journeyStatus: undefined,
          }),
        ]}
        selectedId={null}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(3);
  });

  it("shows the no-results message when empty", () => {
    renderWithIntl(
      <PatientsTable patients={[]} selectedId={null} onSelect={vi.fn()} />,
    );
    expect(
      screen.getByText("No patients match the current filter."),
    ).toBeInTheDocument();
  });

  it("calls onSelect on click and onOpen on double-click", () => {
    const onSelect = vi.fn();
    const onOpen = vi.fn();
    const patient = makePatient();
    renderWithIntl(
      <PatientsTable
        patients={[patient]}
        selectedId={null}
        onSelect={onSelect}
        onOpen={onOpen}
      />,
    );
    const row = screen.getByText("Jane Doe").closest("tr")!;
    fireEvent.click(row);
    fireEvent.doubleClick(row);
    expect(onSelect).toHaveBeenCalledWith(patient);
    expect(onOpen).toHaveBeenCalledWith(patient);
  });

  it("marks the selected row via aria-selected", () => {
    const patient = makePatient();
    renderWithIntl(
      <PatientsTable
        patients={[patient]}
        selectedId="p1"
        onSelect={vi.fn()}
      />,
    );
    const row = screen.getByText("Jane Doe").closest("tr")!;
    expect(row).toHaveAttribute("aria-selected", "true");
  });
});
