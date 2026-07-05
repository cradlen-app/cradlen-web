import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  useUnifiedWaitingList: vi.fn(),
  useInvoices: vi.fn(),
}));

vi.mock("@/features/visits/hooks/useUnifiedWaitingList", () => ({
  useUnifiedWaitingList: mocks.useUnifiedWaitingList,
}));

vi.mock("./useInvoices", () => ({
  useInvoices: mocks.useInvoices,
}));

import { useBillingQueue } from "./useBillingQueue";

function visit(id: string) {
  return { id, kind: "patient" } as never;
}

function repVisit(id: string) {
  return { id, kind: "medical_rep" } as never;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.useUnifiedWaitingList.mockReturnValue({ data: { rows: [] }, isLoading: false });
  mocks.useInvoices.mockReturnValue({ invoices: [], isLoading: false });
});

describe("useBillingQueue", () => {
  it("splits visits into pending (no invoice or DRAFT) and invoiced", () => {
    mocks.useUnifiedWaitingList.mockReturnValue({
      data: { rows: [visit("v-no-inv"), visit("v-draft"), visit("v-issued")] },
      isLoading: false,
    });
    mocks.useInvoices.mockReturnValue({
      invoices: [
        { id: "i-1", visit_id: "v-draft", status: "DRAFT" },
        { id: "i-2", visit_id: "v-issued", status: "ISSUED" },
      ],
      isLoading: false,
    });

    const { result } = renderHook(() => useBillingQueue("branch-1"));

    expect(result.current.pending.map((p) => p.visit.id)).toEqual([
      "v-no-inv",
      "v-draft",
    ]);
    expect(result.current.invoiced.map((p) => p.visit.id)).toEqual(["v-issued"]);
    // the invoiced item carries its matched invoice
    expect(result.current.invoiced[0].invoice?.id).toBe("i-2");
    // a pending-with-DRAFT item still carries the draft invoice
    expect(
      result.current.pending.find((p) => p.visit.id === "v-draft")?.invoice?.id,
    ).toBe("i-1");
  });

  it("excludes medical-rep visits from the queue entirely (reps are never billed)", () => {
    mocks.useUnifiedWaitingList.mockReturnValue({
      data: { rows: [visit("v-patient"), repVisit("v-rep")] },
      isLoading: false,
    });

    const { result } = renderHook(() => useBillingQueue("branch-1"));

    // The rep never has an invoice, so without filtering it would land in
    // `pending` with a "No invoice" label — assert it's absent from both lists.
    const allIds = [...result.current.pending, ...result.current.invoiced].map(
      (p) => p.visit.id,
    );
    expect(allIds).toEqual(["v-patient"]);
    expect(allIds).not.toContain("v-rep");

    // The rep id must not widen the invoice fetch either.
    const [filter] = mocks.useInvoices.mock.calls[0];
    expect(filter.visit_ids).toEqual(["v-patient"]);
  });

  it("bounds the invoice fetch to the on-screen visit ids and enables it only when there are visits", () => {
    mocks.useUnifiedWaitingList.mockReturnValue({
      data: { rows: [visit("v-1"), visit("v-1"), visit("v-2")] },
      isLoading: false,
    });

    renderHook(() => useBillingQueue("branch-1"));

    const [filter, options] = mocks.useInvoices.mock.calls[0];
    // deduped visit ids, branch scoped
    expect(filter.visit_ids).toEqual(["v-1", "v-2"]);
    expect(filter.branch_id).toBe("branch-1");
    expect(options.enabled).toBe(true);
  });

  it("disables the invoice fetch when the waiting list is empty", () => {
    renderHook(() => useBillingQueue("branch-1"));
    const [, options] = mocks.useInvoices.mock.calls[0];
    expect(options.enabled).toBe(false);
  });

  it("reports loading when either source is loading", () => {
    mocks.useUnifiedWaitingList.mockReturnValue({ data: { rows: [] }, isLoading: true });
    const { result } = renderHook(() => useBillingQueue("branch-1"));
    expect(result.current.isLoading).toBe(true);
  });
});
