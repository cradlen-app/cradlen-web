import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/render";

const mockUsePatient = vi.fn();
vi.mock("@/features/patients/hooks/usePatient", () => ({
  usePatient: (id: string) => mockUsePatient(id),
}));

import { PatientSummaryCard } from "./PatientSummaryCard";

describe("PatientSummaryCard", () => {
  beforeEach(() => mockUsePatient.mockReset());

  it("renders the patient name, initials, age and marital status", () => {
    mockUsePatient.mockReturnValue({
      data: {
        data: {
          id: "p-1",
          full_name: "Sara Mahmoud",
          date_of_birth: "1990-01-01",
          phone_number: "+20 100 1234567",
          address: "Cairo",
          marital_status: "MARRIED",
        },
      },
      isLoading: false,
    });
    renderWithIntl(<PatientSummaryCard patientId="p-1" />);

    expect(screen.getByText("Sara Mahmoud")).toBeInTheDocument();
    // Initials of the first two words.
    expect(screen.getByText("SM")).toBeInTheDocument();
    expect(screen.getByText("+20 100 1234567")).toBeInTheDocument();
    expect(screen.getByText("Cairo")).toBeInTheDocument();
    expect(screen.getByText("married")).toBeInTheDocument();
    // Age row renders a "<n> years" value.
    expect(screen.getByText(/\d+ years/)).toBeInTheDocument();
  });

  it("falls back to the loading placeholder name while fetching", () => {
    mockUsePatient.mockReturnValue({ data: undefined, isLoading: true });
    renderWithIntl(<PatientSummaryCard patientId="p-1" />);
    expect(screen.getByText("…")).toBeInTheDocument();
  });

  it("uses the fallback full name and dashes for missing fields", () => {
    mockUsePatient.mockReturnValue({ data: undefined, isLoading: false });
    renderWithIntl(
      <PatientSummaryCard patientId="p-1" fallbackFullName="Mona Adel" />,
    );
    expect(screen.getByText("Mona Adel")).toBeInTheDocument();
    // Missing phone/address/marital → em-dash values.
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("shows the unknown-patient label when nothing resolves", () => {
    mockUsePatient.mockReturnValue({ data: undefined, isLoading: false });
    renderWithIntl(<PatientSummaryCard patientId="p-1" />);
    expect(screen.getByText("Unknown patient")).toBeInTheDocument();
  });
});
