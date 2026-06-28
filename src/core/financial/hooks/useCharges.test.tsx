import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { financialQueryKeys } from "@/core/financial/queryKeys";
import {
  cancelCharge,
  captureCharge,
  fetchCharges,
  fetchVisitCharges,
} from "../lib/charging.api";

const ctx = vi.hoisted(() => ({ organizationId: "org-1" as string | null }));

vi.mock("@/features/auth/store/authContextStore", () => ({
  useAuthContextStore: (selector: (s: { organizationId: string | null }) => unknown) =>
    selector({ organizationId: ctx.organizationId }),
}));
import {
  useCancelCharge,
  useCaptureCharge,
  useCharges,
  useVisitCharges,
} from "./useCharges";

vi.mock("../lib/charging.api", () => ({
  fetchCharges: vi.fn(),
  fetchVisitCharges: vi.fn(),
  captureCharge: vi.fn(),
  updateCharge: vi.fn(),
  cancelCharge: vi.fn(),
  voidCharge: vi.fn(),
  writeOffCharge: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
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

describe("charge hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ctx.organizationId = "org-1";
  });

  describe("useVisitCharges", () => {
    it("returns charges + summary for the visit", async () => {
      vi.mocked(fetchVisitCharges).mockResolvedValue({
        data: {
          charges: [{ id: "ch-1" }],
          summary: { currency: "EGP", pending_total: "10", charge_count: 1 },
        },
      } as never);

      const { result } = renderHook(() => useVisitCharges("visit-1"), {
        wrapper: wrapperFor(makeClient()),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(fetchVisitCharges).toHaveBeenCalledWith("org-1", "visit-1");
      expect(result.current.charges).toEqual([{ id: "ch-1" }]);
      expect(result.current.summary?.charge_count).toBe(1);
    });

    it("stays disabled without a visit id", () => {
      const { result } = renderHook(() => useVisitCharges(undefined), {
        wrapper: wrapperFor(makeClient()),
      });

      expect(result.current.charges).toEqual([]);
      expect(fetchVisitCharges).not.toHaveBeenCalled();
    });
  });

  describe("useCharges", () => {
    it("forwards filters and returns the list", async () => {
      vi.mocked(fetchCharges).mockResolvedValue({
        data: [{ id: "ch-1" }],
      } as never);

      const { result } = renderHook(
        () =>
          useCharges({
            status: "PENDING" as never,
            patientId: "p-1",
            visitId: "v-1",
          }),
        { wrapper: wrapperFor(makeClient()) },
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(fetchCharges).toHaveBeenCalledWith("org-1", {
        status: "PENDING",
        patient_id: "p-1",
        visit_id: "v-1",
        limit: 100,
      });
      expect(result.current.charges).toEqual([{ id: "ch-1" }]);
    });

    it("stays disabled without an org", () => {
      ctx.organizationId = null;

      const { result } = renderHook(() => useCharges(), {
        wrapper: wrapperFor(makeClient()),
      });

      expect(result.current.charges).toEqual([]);
      expect(fetchCharges).not.toHaveBeenCalled();
    });
  });

  describe("useCaptureCharge", () => {
    it("captures and invalidates both charges and invoices", async () => {
      vi.mocked(captureCharge).mockResolvedValue({ id: "ch-1" } as never);
      const queryClient = makeClient();
      const invalidate = vi
        .spyOn(queryClient, "invalidateQueries")
        .mockResolvedValue();

      const { result } = renderHook(() => useCaptureCharge(), {
        wrapper: wrapperFor(queryClient),
      });

      const payload = { service_id: "svc-1" } as never;
      await act(async () => {
        await result.current.mutateAsync(payload);
      });

      expect(captureCharge).toHaveBeenCalledWith("org-1", payload);
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: financialQueryKeys.charges.all(),
      });
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: financialQueryKeys.invoices.all(),
      });
    });

    it("toasts on failure", async () => {
      vi.mocked(captureCharge).mockRejectedValue(new Error("declined"));

      const { result } = renderHook(() => useCaptureCharge(), {
        wrapper: wrapperFor(makeClient()),
      });

      await act(async () => {
        await result.current.mutateAsync({} as never).catch(() => {});
      });

      expect(toast.error).toHaveBeenCalledTimes(1);
    });
  });

  describe("useCancelCharge", () => {
    it("cancels and invalidates only the charges cache", async () => {
      vi.mocked(cancelCharge).mockResolvedValue({ id: "ch-1" } as never);
      const queryClient = makeClient();
      const invalidate = vi
        .spyOn(queryClient, "invalidateQueries")
        .mockResolvedValue();

      const { result } = renderHook(() => useCancelCharge(), {
        wrapper: wrapperFor(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync("ch-1");
      });

      expect(cancelCharge).toHaveBeenCalledWith("org-1", "ch-1");
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: financialQueryKeys.charges.all(),
      });
      expect(invalidate).not.toHaveBeenCalledWith({
        queryKey: financialQueryKeys.invoices.all(),
      });
    });
  });
});
