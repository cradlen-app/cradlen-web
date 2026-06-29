import { screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { renderWithIntl } from "@/test/render";
import { PatientProfileDrawer } from "./PatientProfileDrawer";
import type { ApiPatient } from "@/features/visits/types/visits.api.types";
import { toast } from "sonner";

const { useUpdatePatientMock, mutateAsyncMock } = vi.hoisted(() => ({
  useUpdatePatientMock: vi.fn(),
  mutateAsyncMock: vi.fn(),
}));

vi.mock("../../hooks/useUpdatePatient", () => ({
  useUpdatePatient: () => useUpdatePatientMock(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const PATIENT: ApiPatient = {
  id: "p1",
  full_name: "Jane Doe",
  national_id: "12345678",
  date_of_birth: "1990-05-20T00:00:00.000Z",
  phone_number: "0100000000",
  address: "12 Nile St",
};

beforeEach(() => {
  vi.clearAllMocks();
  mutateAsyncMock.mockResolvedValue(undefined);
  useUpdatePatientMock.mockReturnValue({
    mutateAsync: mutateAsyncMock,
    isPending: false,
  });
});

describe("PatientProfileDrawer", () => {
  it("hydrates the form fields from the patient", () => {
    renderWithIntl(
      <PatientProfileDrawer patient={PATIENT} open onOpenChange={vi.fn()} />,
    );
    expect(screen.getByDisplayValue("Jane Doe")).toBeInTheDocument();
    expect(screen.getByDisplayValue("0100000000")).toBeInTheDocument();
    expect(screen.getByDisplayValue("12 Nile St")).toBeInTheDocument();
    // ISO date is sliced to yyyy-mm-dd for the native date input.
    expect(screen.getByDisplayValue("1990-05-20")).toBeInTheDocument();
  });

  it("keeps the national id locked (read-only) until explicitly unlocked", () => {
    renderWithIntl(
      <PatientProfileDrawer patient={PATIENT} open onOpenChange={vi.fn()} />,
    );
    const idInput = screen.getByDisplayValue("12345678");
    expect(idInput).toHaveAttribute("readonly");
  });

  it("blocks submit and errors when the full name is cleared", async () => {
    renderWithIntl(
      <PatientProfileDrawer patient={PATIENT} open onOpenChange={vi.fn()} />,
    );
    fireEvent.change(screen.getByDisplayValue("Jane Doe"), {
      target: { value: "  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Full name is required."),
    );
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });

  it("submits trimmed demographics without the national id when locked", async () => {
    const onOpenChange = vi.fn();
    renderWithIntl(
      <PatientProfileDrawer
        patient={PATIENT}
        open
        onOpenChange={onOpenChange}
      />,
    );
    fireEvent.change(screen.getByDisplayValue("Jane Doe"), {
      target: { value: "Jane Roe " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(mutateAsyncMock).toHaveBeenCalledTimes(1));
    expect(mutateAsyncMock).toHaveBeenCalledWith({
      id: "p1",
      data: {
        full_name: "Jane Roe",
        date_of_birth: "1990-05-20",
        phone_number: "0100000000",
        address: "12 Nile St",
      },
    });
    expect(toast.success).toHaveBeenCalledWith("Patient updated.");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("unlocks and submits a corrected national id", async () => {
    renderWithIntl(
      <PatientProfileDrawer patient={PATIENT} open onOpenChange={vi.fn()} />,
    );
    // Reveal the warning panel, then confirm the unlock.
    fireEvent.click(screen.getByRole("button", { name: "Correct ID" }));
    fireEvent.click(screen.getByRole("button", { name: "Unlock" }));

    const idInput = screen.getByDisplayValue("12345678");
    expect(idInput).not.toHaveAttribute("readonly");
    fireEvent.change(idInput, { target: { value: "87654321" } });

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(mutateAsyncMock).toHaveBeenCalledTimes(1));
    expect(mutateAsyncMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "p1",
        data: expect.objectContaining({ national_id: "87654321" }),
      }),
    );
  });

  it("rejects an invalid national id format", async () => {
    renderWithIntl(
      <PatientProfileDrawer patient={PATIENT} open onOpenChange={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Correct ID" }));
    fireEvent.click(screen.getByRole("button", { name: "Unlock" }));
    fireEvent.change(screen.getByDisplayValue("12345678"), {
      target: { value: "abc" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "National ID must be 8 to 20 digits.",
      ),
    );
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });

  it("surfaces a generic error toast when the mutation fails", async () => {
    mutateAsyncMock.mockRejectedValue(new Error("boom"));
    renderWithIntl(
      <PatientProfileDrawer patient={PATIENT} open onOpenChange={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Failed to update patient."),
    );
  });
});
