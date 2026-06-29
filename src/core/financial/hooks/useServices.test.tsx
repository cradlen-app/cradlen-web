import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchServices } from "../lib/services.api";
import { useServices } from "./useServices";

const ctx = vi.hoisted(() => ({ organizationId: "org-1" as string | null }));

vi.mock("@/features/auth/store/authContextStore", () => ({
  useAuthContextStore: (selector: (s: { organizationId: string | null }) => unknown) =>
    selector({ organizationId: ctx.organizationId }),
}));

vi.mock("../lib/services.api", () => ({
  fetchServices: vi.fn(),
}));

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function wrapperFor(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useServices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ctx.organizationId = "org-1";
  });

  it("returns the unwrapped services list and forwards filters", async () => {
    vi.mocked(fetchServices).mockResolvedValue({
      data: [{ id: "svc-1" }],
    } as never);
    const filters = { active: true } as never;

    const { result } = renderHook(() => useServices(filters), {
      wrapper: wrapperFor(makeClient()),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetchServices).toHaveBeenCalledWith("org-1", filters);
    expect(result.current.services).toEqual([{ id: "svc-1" }]);
  });

  it("returns an empty list and stays disabled without an org", () => {
    ctx.organizationId = null;

    const { result } = renderHook(() => useServices(), {
      wrapper: wrapperFor(makeClient()),
    });

    expect(result.current.services).toEqual([]);
    expect(fetchServices).not.toHaveBeenCalled();
  });

  it("exposes errors", async () => {
    vi.mocked(fetchServices).mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useServices(), {
      wrapper: wrapperFor(makeClient()),
    });

    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
  });
});
