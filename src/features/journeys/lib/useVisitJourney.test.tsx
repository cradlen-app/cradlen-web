import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchVisitJourney } from "./journeys.api";
import { useVisitJourney } from "./useVisitJourney";

vi.mock("./journeys.api", () => ({
  fetchVisitJourney: vi.fn(),
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

describe("useVisitJourney", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the journey descriptor for a visit", async () => {
    const descriptor = { journey_id: "j-1", care_path_code: "OB" };
    vi.mocked(fetchVisitJourney).mockResolvedValue(descriptor as never);

    const { result } = renderHook(() => useVisitJourney("v-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(descriptor);
    expect(fetchVisitJourney).toHaveBeenCalledWith("v-1", expect.anything());
  });

  it("treats a null descriptor (visit with no journey) as success", async () => {
    vi.mocked(fetchVisitJourney).mockResolvedValue(null);

    const { result } = renderHook(() => useVisitJourney("v-2"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it("stays disabled when no visitId is provided", () => {
    const { result } = renderHook(() => useVisitJourney(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(fetchVisitJourney).not.toHaveBeenCalled();
  });
});
