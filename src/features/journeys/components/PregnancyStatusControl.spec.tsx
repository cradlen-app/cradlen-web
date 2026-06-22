import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PregnancyStatusControl } from "./PregnancyStatusControl";
import * as pregnancyApi from "../lib/pregnancy.api";

// Key-passthrough i18n + no-op toast, mirroring JourneyClinicalTab.spec.
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("PregnancyStatusControl", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("disables the status select once the pregnancy is closed", () => {
    render(
      <PregnancyStatusControl visitId="visit-1" journeyStatus="COMPLETED" />,
      { wrapper },
    );
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select).toBeDisabled();
    expect(select.value).toBe("CLOSED");
  });

  it("opens the outcome drawer when status is set to Closed and submits the outcome", async () => {
    const close = vi
      .spyOn(pregnancyApi, "closePregnancy")
      .mockResolvedValue({
        data: { journey_id: "j1", status: "CLOSED", created_at: "2026-01-01" },
      });

    render(
      <PregnancyStatusControl visitId="visit-1" journeyStatus="ACTIVE" />,
      { wrapper },
    );

    // Choosing "Closed" opens the outcome drawer (defaults to LIVE_BIRTH).
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "CLOSED" },
    });
    expect(await screen.findByText("closeTitle")).toBeInTheDocument();

    // Confirm → POST close with the LIVE_BIRTH outcome + default delivery mode.
    fireEvent.click(screen.getByRole("button", { name: "closePregnancy" }));

    await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
    expect(close).toHaveBeenCalledWith("visit-1", {
      outcome_type: "LIVE_BIRTH",
      delivery_mode: "VAGINAL",
      date: undefined,
      notes: undefined,
    });
  });

  it("drops delivery mode for a non-delivery outcome (e.g. Miscarriage)", async () => {
    const close = vi
      .spyOn(pregnancyApi, "closePregnancy")
      .mockResolvedValue({
        data: { journey_id: "j1", status: "CLOSED", created_at: "2026-01-01" },
      });

    render(
      <PregnancyStatusControl visitId="visit-1" journeyStatus="ACTIVE" />,
      { wrapper },
    );
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "CLOSED" },
    });
    await screen.findByText("closeTitle");

    // The outcome select is the one currently showing LIVE_BIRTH (status shows
    // ACTIVE, delivery mode shows VAGINAL). Switch it to a non-delivery outcome.
    const combos = screen.getAllByRole("combobox") as HTMLSelectElement[];
    const outcomeSelect = combos.find((c) => c.value === "LIVE_BIRTH")!;
    fireEvent.change(outcomeSelect, { target: { value: "MISCARRIAGE" } });

    fireEvent.click(screen.getByRole("button", { name: "closePregnancy" }));
    await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
    expect(close).toHaveBeenCalledWith("visit-1", {
      outcome_type: "MISCARRIAGE",
      delivery_mode: undefined,
      date: undefined,
      notes: undefined,
    });
  });
});
