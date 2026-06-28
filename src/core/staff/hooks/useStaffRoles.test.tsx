import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchRoles } from "../lib/staff.api";
import { useStaffRoles } from "./useStaffRoles";

vi.mock("../lib/staff.api", () => ({
  fetchRoles: vi.fn(),
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

describe("useStaffRoles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches roles and maps them to filter options", async () => {
    vi.mocked(fetchRoles).mockResolvedValue([
      { id: "r-1", name: "OWNER" },
      { id: "r-2", name: "DOCTOR" },
    ] as never);

    const { result } = renderHook(() => useStaffRoles("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([
      { id: "r-1", name: "OWNER", role: expect.any(String) },
      { id: "r-2", name: "DOCTOR", role: expect.any(String) },
    ]);
    expect(fetchRoles).toHaveBeenCalledTimes(1);
  });

  it("is disabled when no organizationId is provided", () => {
    const { result } = renderHook(() => useStaffRoles(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(fetchRoles).not.toHaveBeenCalled();
  });

  it("is disabled when the enabled flag is false", () => {
    const { result } = renderHook(() => useStaffRoles("org-1", false), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(fetchRoles).not.toHaveBeenCalled();
  });
});
