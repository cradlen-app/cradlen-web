import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchInvoices } from "../lib/invoices.api";
import { useVisitInvoice } from "./useVisitInvoice";

const ctx = vi.hoisted(() => ({ organizationId: "org-1" as string | null }));

vi.mock("@/features/auth/store/authContextStore", () => ({
  useAuthContextStore: (selector: (s: { organizationId: string | null }) => unknown) =>
    selector({ organizationId: ctx.organizationId }),
}));

vi.mock("../lib/invoices.api", () => ({
  fetchInvoices: vi.fn(),
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

describe("useVisitInvoice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ctx.organizationId = "org-1";
  });

  it("returns the first non-VOID invoice for the visit", async () => {
    vi.mocked(fetchInvoices).mockResolvedValue({
      data: [
        { id: "inv-void", status: "VOID" },
        { id: "inv-open", status: "OPEN" },
      ],
    } as never);

    const { result } = renderHook(() => useVisitInvoice("visit-1"), {
      wrapper: wrapperFor(makeClient()),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetchInvoices).toHaveBeenCalledWith("org-1", {
      visit_ids: ["visit-1"],
    });
    expect(result.current.invoice).toEqual({ id: "inv-open", status: "OPEN" });
  });

  it("returns null when every invoice is voided", async () => {
    vi.mocked(fetchInvoices).mockResolvedValue({
      data: [{ id: "inv-void", status: "VOID" }],
    } as never);

    const { result } = renderHook(() => useVisitInvoice("visit-1"), {
      wrapper: wrapperFor(makeClient()),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.invoice).toBeNull();
  });

  it("stays disabled without a visit id", () => {
    const { result } = renderHook(() => useVisitInvoice(undefined), {
      wrapper: wrapperFor(makeClient()),
    });

    expect(result.current.invoice).toBeNull();
    expect(fetchInvoices).not.toHaveBeenCalled();
  });
});
