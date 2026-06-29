import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchBranchStaffStats } from "../lib/staff.api";
import { useStaffStats } from "./useStaffStats";

vi.mock("../lib/staff.api", () => ({
  fetchBranchStaffStats: vi.fn(),
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

describe("useStaffStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("unwraps the stats payload for the active org/branch", async () => {
    vi.mocked(fetchBranchStaffStats).mockResolvedValue({
      data: { total: 5, clinical: 3 },
    } as never);

    const { result } = renderHook(() => useStaffStats("org-1", "branch-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchBranchStaffStats).toHaveBeenCalledWith("org-1", "branch-1");
    expect(result.current.data).toEqual({ total: 5, clinical: 3 });
  });

  it("stays disabled without a branch", () => {
    const { result } = renderHook(() => useStaffStats("org-1", undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(fetchBranchStaffStats).not.toHaveBeenCalled();
  });

  it("exposes errors", async () => {
    vi.mocked(fetchBranchStaffStats).mockRejectedValue(new Error("nope"));

    const { result } = renderHook(() => useStaffStats("org-1", "branch-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
