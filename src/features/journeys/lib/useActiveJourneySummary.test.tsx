import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchActiveJourneySummary } from "./active-journey-summary.api";
import { useActiveJourneySummary } from "./useActiveJourneySummary";

vi.mock("./active-journey-summary.api", () => ({
  fetchActiveJourneySummary: vi.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useActiveJourneySummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches and returns the summary data for a patient", async () => {
    const summary = { journey_exists: true, journey_id: "j-1" };
    vi.mocked(fetchActiveJourneySummary).mockResolvedValue({
      data: summary,
    } as never);

    const { result } = renderHook(() => useActiveJourneySummary("p-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(summary);
    expect(fetchActiveJourneySummary).toHaveBeenCalledWith("p-1");
  });

  it("stays disabled (no fetch) when patientId is missing", () => {
    const { result } = renderHook(() => useActiveJourneySummary(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(fetchActiveJourneySummary).not.toHaveBeenCalled();
  });

  it("surfaces fetch errors", async () => {
    vi.mocked(fetchActiveJourneySummary).mockRejectedValue(
      new Error("boom"),
    );

    const { result } = renderHook(() => useActiveJourneySummary("p-2"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});
