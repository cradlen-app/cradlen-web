import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { financialQueryKeys } from "@/core/financial/queryKeys";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { recordPayment } from "../lib/invoices.api";
import { useRecordPayment } from "./useRecordPayment";

vi.mock("../lib/invoices.api", () => ({
  recordPayment: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
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

const payload = { amount: 100, method: "cash" } as never;

describe("useRecordPayment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthContextStore.setState({
      organizationId: "org-1",
      branchId: "branch-1",
      profileId: "profile-1",
    });
  });

  afterEach(() => {
    useAuthContextStore.setState({
      organizationId: null,
      branchId: null,
      profileId: null,
    });
  });

  it("records the payment and invalidates invoice/payment queries", async () => {
    vi.mocked(recordPayment).mockResolvedValue({ data: { id: "pay-1" } } as never);

    const queryClient = makeClient();
    const invalidate = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue();

    const { result } = renderHook(() => useRecordPayment(), {
      wrapper: wrapperFor(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ invoiceId: "inv-1", payload });
    });

    expect(recordPayment).toHaveBeenCalledWith("org-1", "inv-1", payload);
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: financialQueryKeys.invoices.byId("inv-1"),
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: financialQueryKeys.invoices.payments("inv-1"),
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: financialQueryKeys.invoices.all(),
    });
  });

  it("toasts an error message when recording fails", async () => {
    vi.mocked(recordPayment).mockRejectedValue(new Error("declined"));

    const { result } = renderHook(() => useRecordPayment(), {
      wrapper: wrapperFor(makeClient()),
    });

    await act(async () => {
      await result.current
        .mutateAsync({ invoiceId: "inv-1", payload })
        .catch(() => {});
    });

    expect(toast.error).toHaveBeenCalledTimes(1);
  });
});
