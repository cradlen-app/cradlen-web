import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SurgicalStatusInput } from "./SurgicalStatusInput";
import { JourneyClinicalContext } from "../lib/journey-clinical-context";
import * as surgicalApi from "../lib/surgical.api";
import type { FieldInputProps } from "@/builder/fields/input-props";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <JourneyClinicalContext.Provider value={{ visitId: "v1" }}>
        {children}
      </JourneyClinicalContext.Provider>
    </QueryClientProvider>
  );
}

function makeProps(value: string): FieldInputProps {
  return {
    field: {
      id: "f-status",
      code: "status",
      label: "Status",
      type: "SELECT",
      config: { ui: { variant: "surgical-status" } },
    } as unknown as FieldInputProps["field"],
    value,
    onChange: vi.fn(),
    required: false,
    disabled: false,
  };
}

describe("SurgicalStatusInput", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("disables the select once the surgery is closed", () => {
    render(<SurgicalStatusInput {...makeProps("CLOSED")} />, { wrapper });
    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("keeps the select enabled while active", () => {
    render(<SurgicalStatusInput {...makeProps("ACTIVE")} />, { wrapper });
    expect(screen.getByRole("combobox")).not.toBeDisabled();
  });

  it("opens the outcome drawer on Closed and submits the chosen outcome", async () => {
    const close = vi
      .spyOn(surgicalApi, "closeSurgical")
      .mockResolvedValue({
        data: { journey_id: "j1", status: "CLOSED", created_at: "2026-01-01" },
      });

    render(<SurgicalStatusInput {...makeProps("ACTIVE")} />, { wrapper });
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "CLOSED" },
    });
    expect(await screen.findByText("closeTitle")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "closeSurgical" }));
    await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
    expect(close).toHaveBeenCalledWith("v1", {
      outcome_type: "COMPLETED",
      date: undefined,
      notes: undefined,
    });
  });

  it("sends the selected outcome type, date and notes", async () => {
    const close = vi
      .spyOn(surgicalApi, "closeSurgical")
      .mockResolvedValue({
        data: { journey_id: "j1", status: "CLOSED", created_at: "2026-01-01" },
      });

    const { baseElement } = render(
      <SurgicalStatusInput {...makeProps("ACTIVE")} />,
      { wrapper },
    );
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "CLOSED" },
    });
    await screen.findByText("closeTitle");

    // The outcome-type select is the second combobox inside the drawer.
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[selects.length - 1], {
      target: { value: "ABORTED" },
    });
    const dateInput = baseElement.querySelector(
      'input[type="date"]',
    ) as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: "2026-02-02" } });

    fireEvent.click(screen.getByRole("button", { name: "closeSurgical" }));
    await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
    expect(close).toHaveBeenCalledWith("v1", {
      outcome_type: "ABORTED",
      date: "2026-02-02",
      notes: undefined,
    });
  });
});
