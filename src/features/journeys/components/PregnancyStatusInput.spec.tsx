import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PregnancyStatusInput } from "./PregnancyStatusInput";
import { JourneyClinicalContext } from "../lib/journey-clinical-context";
import * as pregnancyApi from "../lib/pregnancy.api";
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
      config: { ui: { variant: "pregnancy-status" } },
    } as unknown as FieldInputProps["field"],
    value,
    onChange: vi.fn(),
    required: false,
    disabled: false,
  };
}

describe("PregnancyStatusInput", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("disables the select once the pregnancy is closed", () => {
    render(<PregnancyStatusInput {...makeProps("CLOSED")} />, { wrapper });
    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("opens the outcome drawer on Closed and submits the outcome", async () => {
    const close = vi
      .spyOn(pregnancyApi, "closePregnancy")
      .mockResolvedValue({
        data: { journey_id: "j1", status: "CLOSED", created_at: "2026-01-01" },
      });

    render(<PregnancyStatusInput {...makeProps("ACTIVE")} />, { wrapper });
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "CLOSED" },
    });
    expect(await screen.findByText("closeTitle")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "closePregnancy" }));
    await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
    expect(close).toHaveBeenCalledWith("v1", {
      outcome_type: "LIVE_BIRTH",
      delivery_mode: "VAGINAL",
      date: undefined,
      notes: undefined,
    });
  });
});
