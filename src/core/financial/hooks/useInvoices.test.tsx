import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchInvoices } from "../lib/invoices.api";
import { useInvoices } from "./useInvoices";

const ctx = vi.hoisted(() => ({ organizationId: "org-1" as string | null }));

vi.mock("@/features/auth/store/authContextStore", () => ({
  useAuthContextStore: (selector: (s: { organizationId: string | null }) => unknown) =>
    selector({ organizationId: ctx.organizationId }),
}));

vi.mock("../lib/invoices.api", () => ({
  fetchInvoices: vi.fn(),
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

describe("useInvoices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ctx.organizationId = "org-1";
  });

  it("returns invoices plus pagination meta on success", async () => {
    vi.mocked(fetchInvoices).mockResolvedValue({
      data: [{ id: "inv-1" }],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    } as never);

    const { result } = renderHook(() => useInvoices(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.invoices).toEqual([{ id: "inv-1" }]);
    expect(result.current.total).toBe(1);
    expect(result.current.page).toBe(1);
    expect(result.current.totalPages).toBe(1);
    expect(fetchInvoices).toHaveBeenCalledWith("org-1", undefined);
  });

  it("passes filters through to the API", async () => {
    vi.mocked(fetchInvoices).mockResolvedValue({
      data: [],
      meta: undefined,
    } as never);

    const filters = { branch_id: "branch-1", status: "open" } as never;
    const { result } = renderHook(() => useInvoices(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetchInvoices).toHaveBeenCalledWith("org-1", filters);
  });

  it("stays disabled and returns empty list when no organization is set", () => {
    ctx.organizationId = null;

    const { result } = renderHook(() => useInvoices(), {
      wrapper: createWrapper(),
    });

    expect(result.current.invoices).toEqual([]);
    expect(fetchInvoices).not.toHaveBeenCalled();
  });

  it("respects the enabled option flag", () => {
    const { result } = renderHook(() => useInvoices(undefined, { enabled: false }), {
      wrapper: createWrapper(),
    });

    expect(result.current.invoices).toEqual([]);
    expect(fetchInvoices).not.toHaveBeenCalled();
  });

  it("exposes query errors", async () => {
    vi.mocked(fetchInvoices).mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useInvoices(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
  });
});
