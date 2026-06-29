import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { listBranches } from "@/features/settings/lib/settings.api";
import { fetchJobFunctions, fetchSpecialties } from "../lib/staff.api";
import { useJobFunctions, useOrgBranches, useSpecialties } from "./useStaffLookups";

vi.mock("../lib/staff.api", () => ({
  fetchJobFunctions: vi.fn(),
  fetchSpecialties: vi.fn(),
}));

vi.mock("@/features/settings/lib/settings.api", () => ({
  listBranches: vi.fn(),
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

describe("useJobFunctions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads job functions when enabled", async () => {
    vi.mocked(fetchJobFunctions).mockResolvedValue([{ id: "jf1" }] as never);

    const { result } = renderHook(() => useJobFunctions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: "jf1" }]);
  });

  it("stays idle when disabled", () => {
    const { result } = renderHook(() => useJobFunctions(false), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(fetchJobFunctions).not.toHaveBeenCalled();
  });
});

describe("useSpecialties", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads specialties when enabled", async () => {
    vi.mocked(fetchSpecialties).mockResolvedValue([{ id: "sp1" }] as never);

    const { result } = renderHook(() => useSpecialties(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: "sp1" }]);
  });
});

describe("useOrgBranches", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches branches for the org", async () => {
    vi.mocked(listBranches).mockResolvedValue([{ id: "b1" }] as never);

    const { result } = renderHook(() => useOrgBranches("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listBranches).toHaveBeenCalledWith("org-1");
    expect(result.current.data).toEqual([{ id: "b1" }]);
  });

  it("stays disabled when org id is missing", () => {
    const { result } = renderHook(() => useOrgBranches(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(listBranches).not.toHaveBeenCalled();
  });

  it("stays disabled when explicitly disabled", () => {
    const { result } = renderHook(() => useOrgBranches("org-1", false), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(listBranches).not.toHaveBeenCalled();
  });
});
