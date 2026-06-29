import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

const ctx = vi.hoisted(() => ({
  organizationId: "org-1" as string | null,
  branchId: "branch-1" as string | null,
}));

vi.mock("@/features/auth/store/authContextStore", () => ({
  useAuthContextStore: (
    selector: (s: { organizationId: string | null; branchId: string | null }) => unknown,
  ) => selector({ organizationId: ctx.organizationId, branchId: ctx.branchId }),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("../lib/pricing.api", () => ({
  fetchPriceLists: vi.fn(),
  createPriceList: vi.fn(),
  updatePriceList: vi.fn(),
  deletePriceList: vi.fn(),
  setDefaultPriceList: vi.fn(),
  activatePriceList: vi.fn(),
  deactivatePriceList: vi.fn(),
  setPriceListItems: vi.fn(),
  fetchPriceListItems: vi.fn(),
  addPriceListItem: vi.fn(),
  updatePriceListItem: vi.fn(),
  removePriceListItem: vi.fn(),
  resolvePrice: vi.fn(),
  fetchProviderOverrides: vi.fn(),
  createProviderOverride: vi.fn(),
  updateProviderOverride: vi.fn(),
  deleteProviderOverride: vi.fn(),
  fetchProviderServices: vi.fn(),
  authorizeProviderService: vi.fn(),
  authorizeProviderServices: vi.fn(),
  activateProviderService: vi.fn(),
  deactivateProviderService: vi.fn(),
  revokeProviderService: vi.fn(),
}));

vi.mock("../lib/invoices.api", () => ({
  fetchInvoices: vi.fn(),
  fetchInvoice: vi.fn(),
  fetchPayments: vi.fn(),
  createInvoice: vi.fn(),
  buildInvoiceFromCharges: vi.fn(),
  appendChargesToInvoice: vi.fn(),
  updateInvoice: vi.fn(),
  issueInvoice: vi.fn(),
  voidInvoice: vi.fn(),
  recordPayment: vi.fn(),
  voidPayment: vi.fn(),
}));

vi.mock("../lib/cash.api", () => ({
  fetchCashSessions: vi.fn(),
  fetchCurrentCashSession: vi.fn(),
  fetchCashSession: vi.fn(),
  openCashSession: vi.fn(),
  closeCashSession: vi.fn(),
  reconcileCashSession: vi.fn(),
}));

vi.mock("../lib/refunds.api", () => ({
  fetchRefundsForInvoice: vi.fn(),
  createRefund: vi.fn(),
  voidRefund: vi.fn(),
}));

vi.mock("../lib/receipts.api", () => ({
  fetchReceiptsForInvoice: vi.fn(),
  fetchReceipt: vi.fn(),
  fetchReceiptPrint: vi.fn(),
}));

vi.mock("../lib/reporting.api", () => ({
  fetchReport: vi.fn(),
}));

vi.mock("../lib/services.api", () => ({
  activateService: vi.fn(),
  deactivateService: vi.fn(),
}));

import * as pricingApi from "../lib/pricing.api";
import * as invoicesApi from "../lib/invoices.api";
import * as cashApi from "../lib/cash.api";
import * as refundsApi from "../lib/refunds.api";
import * as receiptsApi from "../lib/receipts.api";
import * as reportingApi from "../lib/reporting.api";
import * as servicesApi from "../lib/services.api";

import { usePriceLists } from "./usePriceLists";
import { usePriceListItems } from "./usePriceListItems";
import { useProviderOverrides } from "./useProviderOverrides";
import { useResolvePrice } from "./useResolvePrice";
import { useCreatePriceList } from "./useCreatePriceList";
import { useUpdatePriceList } from "./useUpdatePriceList";
import { useDeletePriceList } from "./useDeletePriceList";
import { useCreateProviderOverride } from "./useCreateProviderOverride";
import { useUpdateProviderOverride } from "./useUpdateProviderOverride";
import { useDeleteProviderOverride } from "./useDeleteProviderOverride";
import { useAddPriceListItem } from "./useAddPriceListItem";
import { useUpdatePriceListItem } from "./useUpdatePriceListItem";
import { useRemovePriceListItem } from "./useRemovePriceListItem";
import {
  useSetDefaultPriceList,
  useTogglePriceListActive,
  useBulkSetPriceListItems,
} from "./usePriceListActions";
import {
  useProviderServices,
  useAuthorizeService,
  useAuthorizeServices,
  useRevokeProviderService,
  useToggleProviderServiceActive,
} from "./useAuthorizations";
import { useInvoice } from "./useInvoice";
import { usePayments } from "./usePayments";
import { useCreateInvoice } from "./useCreateInvoice";
import { useUpdateInvoice } from "./useUpdateInvoice";
import { useIssueInvoice } from "./useIssueInvoice";
import { useVoidInvoice } from "./useVoidInvoice";
import { useVoidPayment } from "./useVoidPayment";
import { useBuildInvoiceFromCharges } from "./useBuildInvoiceFromCharges";
import { useAppendChargesToInvoice } from "./useAppendChargesToInvoice";
import { useInvoiceDetail } from "./useInvoiceDetail";
import {
  useCurrentCashSession,
  useCashSessions,
  useOpenCashSession,
  useCloseCashSession,
  useReconcileCashSession,
} from "./useCashSessions";
import { useRefunds, useCreateRefund, useVoidRefund } from "./useRefunds";
import { useReceipts, useReceiptPrint } from "./useReceipts";
import { useFinancialReport } from "./useReports";
import { useToggleServiceActive } from "./useServiceActions";

function makeClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function wrapperFor(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

function ok<T>(data: T) {
  return { data } as never;
}

async function runSuccess(
  hook: () => { mutateAsync: (v: never) => Promise<unknown> },
  variables: unknown,
) {
  const { result } = renderHook(hook, { wrapper: wrapperFor(makeClient()) });
  await act(async () => {
    await result.current.mutateAsync(variables as never);
  });
}

async function runError(
  hook: () => { mutateAsync: (v: never) => Promise<unknown> },
  variables: unknown,
) {
  const { result } = renderHook(hook, { wrapper: wrapperFor(makeClient()) });
  await act(async () => {
    await result.current.mutateAsync(variables as never).catch(() => {});
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  ctx.organizationId = "org-1";
  ctx.branchId = "branch-1";
});

describe("pricing query hooks", () => {
  it("usePriceLists fetches and returns the list", async () => {
    vi.mocked(pricingApi.fetchPriceLists).mockResolvedValue(ok([{ id: "pl-1" }]));
    const { result } = renderHook(() => usePriceLists("branch-1"), {
      wrapper: wrapperFor(makeClient()),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(pricingApi.fetchPriceLists).toHaveBeenCalledWith("org-1", "branch-1");
    expect(result.current.priceLists).toEqual([{ id: "pl-1" }]);
  });

  it("usePriceLists is disabled without an org", () => {
    ctx.organizationId = null;
    const { result } = renderHook(() => usePriceLists(), {
      wrapper: wrapperFor(makeClient()),
    });
    expect(result.current.priceLists).toEqual([]);
    expect(pricingApi.fetchPriceLists).not.toHaveBeenCalled();
  });

  it("usePriceListItems fetches with an id and stays disabled without one", async () => {
    vi.mocked(pricingApi.fetchPriceListItems).mockResolvedValue(ok([{ id: "i-1" }]));
    const { result } = renderHook(() => usePriceListItems("pl-1"), {
      wrapper: wrapperFor(makeClient()),
    });
    await waitFor(() => expect(result.current.items).toEqual([{ id: "i-1" }]));

    const disabled = renderHook(() => usePriceListItems(null), {
      wrapper: wrapperFor(makeClient()),
    });
    expect(disabled.result.current.items).toEqual([]);
  });

  it("useProviderOverrides fetches per profile", async () => {
    vi.mocked(pricingApi.fetchProviderOverrides).mockResolvedValue(ok([{ id: "o-1" }]));
    const { result } = renderHook(() => useProviderOverrides("prof-1"), {
      wrapper: wrapperFor(makeClient()),
    });
    await waitFor(() => expect(result.current.overrides).toEqual([{ id: "o-1" }]));
    expect(pricingApi.fetchProviderOverrides).toHaveBeenCalledWith("org-1", "prof-1");
  });

  it("useResolvePrice resolves a price and stays disabled when args missing", async () => {
    vi.mocked(pricingApi.resolvePrice).mockResolvedValue(ok({ amount: "100" }));
    const { result } = renderHook(
      () => useResolvePrice("svc-1", "branch-1", "prof-1"),
      { wrapper: wrapperFor(makeClient()) },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(pricingApi.resolvePrice).toHaveBeenCalledWith(
      "org-1",
      "svc-1",
      "branch-1",
      "prof-1",
    );
    expect(result.current.resolvedPrice).toEqual({ amount: "100" });

    const disabled = renderHook(() => useResolvePrice(null, null), {
      wrapper: wrapperFor(makeClient()),
    });
    expect(disabled.result.current.resolvedPrice).toBeUndefined();
  });

  it("useProviderServices lists authorizations", async () => {
    vi.mocked(pricingApi.fetchProviderServices).mockResolvedValue(ok([{ id: "ps-1" }]));
    const { result } = renderHook(() => useProviderServices("prof-1"), {
      wrapper: wrapperFor(makeClient()),
    });
    await waitFor(() => expect(result.current.authorizations).toEqual([{ id: "ps-1" }]));

    const disabled = renderHook(() => useProviderServices(null), {
      wrapper: wrapperFor(makeClient()),
    });
    expect(disabled.result.current.authorizations).toEqual([]);
  });
});

describe("pricing mutation hooks", () => {
  it("useCreatePriceList success + error", async () => {
    vi.mocked(pricingApi.createPriceList).mockResolvedValue(ok({ id: "pl-1" }));
    await runSuccess(() => useCreatePriceList(), { name: "Standard" });
    expect(pricingApi.createPriceList).toHaveBeenCalledWith("org-1", { name: "Standard" });
    expect(toast.success).toHaveBeenCalled();

    vi.mocked(pricingApi.createPriceList).mockRejectedValue(new Error("x"));
    await runError(() => useCreatePriceList(), {});
    expect(toast.error).toHaveBeenCalled();
  });

  it("useUpdatePriceList success", async () => {
    vi.mocked(pricingApi.updatePriceList).mockResolvedValue(ok({ id: "pl-1" }));
    await runSuccess(() => useUpdatePriceList(), { id: "pl-1", payload: { name: "X" } });
    expect(pricingApi.updatePriceList).toHaveBeenCalledWith("org-1", "pl-1", { name: "X" });
  });

  it("useDeletePriceList success + error", async () => {
    vi.mocked(pricingApi.deletePriceList).mockResolvedValue(ok(null));
    await runSuccess(() => useDeletePriceList(), "pl-1");
    expect(pricingApi.deletePriceList).toHaveBeenCalledWith("org-1", "pl-1");
    vi.mocked(pricingApi.deletePriceList).mockRejectedValue(new Error("x"));
    await runError(() => useDeletePriceList(), "pl-1");
    expect(toast.error).toHaveBeenCalled();
  });

  it("useCreateProviderOverride success", async () => {
    vi.mocked(pricingApi.createProviderOverride).mockResolvedValue(ok({ id: "o-1" }));
    await runSuccess(() => useCreateProviderOverride("prof-1"), { service_id: "s" });
    expect(pricingApi.createProviderOverride).toHaveBeenCalledWith("org-1", "prof-1", {
      service_id: "s",
    });
  });

  it("useUpdateProviderOverride success", async () => {
    vi.mocked(pricingApi.updateProviderOverride).mockResolvedValue(ok({ id: "o-1" }));
    await runSuccess(() => useUpdateProviderOverride("prof-1"), {
      id: "o-1",
      payload: { amount: "5" },
    });
    expect(pricingApi.updateProviderOverride).toHaveBeenCalledWith(
      "org-1",
      "prof-1",
      "o-1",
      { amount: "5" },
    );
  });

  it("useDeleteProviderOverride error path", async () => {
    vi.mocked(pricingApi.deleteProviderOverride).mockRejectedValue(new Error("x"));
    await runError(() => useDeleteProviderOverride("prof-1"), "o-1");
    expect(toast.error).toHaveBeenCalled();
  });

  it("useAddPriceListItem / useUpdatePriceListItem / useRemovePriceListItem", async () => {
    vi.mocked(pricingApi.addPriceListItem).mockResolvedValue(ok({ id: "i-1" }));
    await runSuccess(() => useAddPriceListItem("pl-1"), { service_id: "s" });
    expect(pricingApi.addPriceListItem).toHaveBeenCalledWith("org-1", "pl-1", {
      service_id: "s",
    });

    vi.mocked(pricingApi.updatePriceListItem).mockResolvedValue(ok({ id: "i-1" }));
    await runSuccess(() => useUpdatePriceListItem("pl-1"), {
      itemId: "i-1",
      payload: { amount: "5" },
    });
    expect(pricingApi.updatePriceListItem).toHaveBeenCalledWith(
      "org-1",
      "pl-1",
      "i-1",
      { amount: "5" },
    );

    vi.mocked(pricingApi.removePriceListItem).mockResolvedValue(ok(null));
    await runSuccess(() => useRemovePriceListItem("pl-1"), "i-1");
    expect(pricingApi.removePriceListItem).toHaveBeenCalledWith("org-1", "pl-1", "i-1");
  });

  it("useSetDefaultPriceList success", async () => {
    vi.mocked(pricingApi.setDefaultPriceList).mockResolvedValue(ok(null));
    await runSuccess(() => useSetDefaultPriceList(), "pl-1");
    expect(pricingApi.setDefaultPriceList).toHaveBeenCalledWith("org-1", "pl-1");
  });

  it("useTogglePriceListActive activate and deactivate", async () => {
    vi.mocked(pricingApi.activatePriceList).mockResolvedValue(ok(null));
    vi.mocked(pricingApi.deactivatePriceList).mockResolvedValue(ok(null));
    await runSuccess(() => useTogglePriceListActive(), { id: "pl-1", active: true });
    expect(pricingApi.activatePriceList).toHaveBeenCalledWith("org-1", "pl-1");
    await runSuccess(() => useTogglePriceListActive(), { id: "pl-1", active: false });
    expect(pricingApi.deactivatePriceList).toHaveBeenCalledWith("org-1", "pl-1");
  });

  it("useBulkSetPriceListItems success + error", async () => {
    vi.mocked(pricingApi.setPriceListItems).mockResolvedValue(ok(null));
    await runSuccess(() => useBulkSetPriceListItems("pl-1"), { items: [] });
    expect(pricingApi.setPriceListItems).toHaveBeenCalledWith("org-1", "pl-1", {
      items: [],
    });
    vi.mocked(pricingApi.setPriceListItems).mockRejectedValue(new Error("x"));
    await runError(() => useBulkSetPriceListItems("pl-1"), { items: [] });
    expect(toast.error).toHaveBeenCalled();
  });

  it("useAuthorizeService / useAuthorizeServices success", async () => {
    vi.mocked(pricingApi.authorizeProviderService).mockResolvedValue(ok({ id: "a" }));
    await runSuccess(() => useAuthorizeService("prof-1"), { service_id: "s" });
    expect(pricingApi.authorizeProviderService).toHaveBeenCalledWith("org-1", "prof-1", {
      service_id: "s",
    });

    vi.mocked(pricingApi.authorizeProviderServices).mockResolvedValue(ok({ count: 2 }));
    await runSuccess(() => useAuthorizeServices("prof-1"), { service_ids: ["s"] });
    expect(pricingApi.authorizeProviderServices).toHaveBeenCalled();
  });

  it("useAuthorizeServices error path", async () => {
    vi.mocked(pricingApi.authorizeProviderServices).mockRejectedValue(new Error("x"));
    await runError(() => useAuthorizeServices("prof-1"), { service_ids: ["s"] });
    expect(toast.error).toHaveBeenCalled();
  });

  it("useRevokeProviderService success", async () => {
    vi.mocked(pricingApi.revokeProviderService).mockResolvedValue(ok(null));
    await runSuccess(() => useRevokeProviderService("prof-1"), "svc-1");
    expect(pricingApi.revokeProviderService).toHaveBeenCalledWith("org-1", "prof-1", "svc-1");
  });

  it("useToggleProviderServiceActive activate and deactivate", async () => {
    vi.mocked(pricingApi.activateProviderService).mockResolvedValue(ok(null));
    vi.mocked(pricingApi.deactivateProviderService).mockResolvedValue(ok(null));
    await runSuccess(() => useToggleProviderServiceActive("prof-1"), {
      serviceId: "svc-1",
      active: true,
    });
    expect(pricingApi.activateProviderService).toHaveBeenCalled();
    await runSuccess(() => useToggleProviderServiceActive("prof-1"), {
      serviceId: "svc-1",
      active: false,
    });
    expect(pricingApi.deactivateProviderService).toHaveBeenCalled();
  });
});

describe("invoice hooks", () => {
  it("useInvoice fetches and stays disabled without id", async () => {
    vi.mocked(invoicesApi.fetchInvoice).mockResolvedValue(ok({ id: "inv-1" }));
    const { result } = renderHook(() => useInvoice("inv-1"), {
      wrapper: wrapperFor(makeClient()),
    });
    await waitFor(() => expect(result.current.invoice).toEqual({ id: "inv-1" }));

    const disabled = renderHook(() => useInvoice(null), {
      wrapper: wrapperFor(makeClient()),
    });
    expect(disabled.result.current.invoice).toBeUndefined();
  });

  it("usePayments fetches payments", async () => {
    vi.mocked(invoicesApi.fetchPayments).mockResolvedValue(ok([{ id: "pay-1" }]));
    const { result } = renderHook(() => usePayments("inv-1"), {
      wrapper: wrapperFor(makeClient()),
    });
    await waitFor(() => expect(result.current.payments).toEqual([{ id: "pay-1" }]));
  });

  it("useCreateInvoice success + error", async () => {
    vi.mocked(invoicesApi.createInvoice).mockResolvedValue(ok({ id: "inv-1" }));
    await runSuccess(() => useCreateInvoice(), { patient_id: "p" });
    expect(invoicesApi.createInvoice).toHaveBeenCalledWith("org-1", { patient_id: "p" });
    vi.mocked(invoicesApi.createInvoice).mockRejectedValue(new Error("x"));
    await runError(() => useCreateInvoice(), {});
    expect(toast.error).toHaveBeenCalled();
  });

  it("useUpdateInvoice success", async () => {
    vi.mocked(invoicesApi.updateInvoice).mockResolvedValue(ok({ id: "inv-1" }));
    await runSuccess(() => useUpdateInvoice(), { id: "inv-1", payload: { notes: "n" } });
    expect(invoicesApi.updateInvoice).toHaveBeenCalledWith("org-1", "inv-1", { notes: "n" });
  });

  it("useIssueInvoice and useVoidInvoice success", async () => {
    vi.mocked(invoicesApi.issueInvoice).mockResolvedValue(ok({ id: "inv-1" }));
    await runSuccess(() => useIssueInvoice(), "inv-1");
    expect(invoicesApi.issueInvoice).toHaveBeenCalledWith("org-1", "inv-1");

    vi.mocked(invoicesApi.voidInvoice).mockResolvedValue(ok({ id: "inv-1" }));
    await runSuccess(() => useVoidInvoice(), "inv-1");
    expect(invoicesApi.voidInvoice).toHaveBeenCalledWith("org-1", "inv-1");
  });

  it("useVoidPayment success + error", async () => {
    vi.mocked(invoicesApi.voidPayment).mockResolvedValue(ok(null));
    await runSuccess(() => useVoidPayment("inv-1"), "pay-1");
    expect(invoicesApi.voidPayment).toHaveBeenCalledWith("org-1", "inv-1", "pay-1");
    vi.mocked(invoicesApi.voidPayment).mockRejectedValue(new Error("x"));
    await runError(() => useVoidPayment("inv-1"), "pay-1");
    expect(toast.error).toHaveBeenCalled();
  });

  it("useBuildInvoiceFromCharges success + error", async () => {
    vi.mocked(invoicesApi.buildInvoiceFromCharges).mockResolvedValue(ok({ id: "inv-1" }));
    await runSuccess(() => useBuildInvoiceFromCharges(), { patient_id: "p" });
    expect(invoicesApi.buildInvoiceFromCharges).toHaveBeenCalled();
    vi.mocked(invoicesApi.buildInvoiceFromCharges).mockRejectedValue(new Error("x"));
    await runError(() => useBuildInvoiceFromCharges(), {});
    expect(toast.error).toHaveBeenCalled();
  });

  it("useAppendChargesToInvoice success + error", async () => {
    vi.mocked(invoicesApi.appendChargesToInvoice).mockResolvedValue(ok({ id: "inv-1" }));
    await runSuccess(() => useAppendChargesToInvoice(), {
      invoiceId: "inv-1",
      payload: { charge_ids: ["c"] },
    });
    expect(invoicesApi.appendChargesToInvoice).toHaveBeenCalledWith("org-1", "inv-1", {
      charge_ids: ["c"],
    });
    vi.mocked(invoicesApi.appendChargesToInvoice).mockRejectedValue(new Error("x"));
    await runError(() => useAppendChargesToInvoice(), {
      invoiceId: "inv-1",
      payload: {},
    });
    expect(toast.error).toHaveBeenCalled();
  });

  it("useInvoiceDetail aggregates invoice, payments, refunds and permissions", async () => {
    vi.mocked(invoicesApi.fetchInvoice).mockResolvedValue(ok({ id: "inv-1", status: "ISSUED" }));
    vi.mocked(invoicesApi.fetchPayments).mockResolvedValue(ok([{ id: "pay-1" }]));
    vi.mocked(receiptsApi.fetchReceiptsForInvoice).mockResolvedValue(
      ok([{ id: "r-1", payment_id: "pay-1" }]),
    );
    vi.mocked(refundsApi.fetchRefundsForInvoice).mockResolvedValue(ok([{ id: "rf-1" }]));

    const { result } = renderHook(() => useInvoiceDetail("inv-1"), {
      wrapper: wrapperFor(makeClient()),
    });
    await waitFor(() => expect(result.current.invoice).toEqual({ id: "inv-1", status: "ISSUED" }));
    await waitFor(() =>
      expect(result.current.receiptByPayment.get("pay-1")).toBeDefined(),
    );
    expect(result.current.permissions).toBeDefined();
    expect(result.current.issueMutation).toBeDefined();
  });
});

describe("cash session hooks", () => {
  it("useCurrentCashSession fetches when org+branch set", async () => {
    vi.mocked(cashApi.fetchCurrentCashSession).mockResolvedValue(ok({ id: "cs-1" }));
    const { result } = renderHook(() => useCurrentCashSession(), {
      wrapper: wrapperFor(makeClient()),
    });
    await waitFor(() => expect(result.current.session).toEqual({ id: "cs-1" }));
  });

  it("useCurrentCashSession disabled without branch", () => {
    ctx.branchId = null;
    const { result } = renderHook(() => useCurrentCashSession(), {
      wrapper: wrapperFor(makeClient()),
    });
    expect(result.current.session).toBeNull();
    expect(cashApi.fetchCurrentCashSession).not.toHaveBeenCalled();
  });

  it("useCashSessions lists with a status filter", async () => {
    vi.mocked(cashApi.fetchCashSessions).mockResolvedValue(ok([{ id: "cs-1" }]));
    const { result } = renderHook(() => useCashSessions("OPEN" as never), {
      wrapper: wrapperFor(makeClient()),
    });
    await waitFor(() => expect(result.current.sessions).toEqual([{ id: "cs-1" }]));
    expect(cashApi.fetchCashSessions).toHaveBeenCalledWith("org-1", {
      branch_id: "branch-1",
      status: "OPEN",
      limit: 50,
    });
  });

  it("useOpenCashSession / useCloseCashSession / useReconcileCashSession", async () => {
    vi.mocked(cashApi.openCashSession).mockResolvedValue(ok({ id: "cs-1" }));
    await runSuccess(() => useOpenCashSession(), { opening_float: "100" });
    expect(cashApi.openCashSession).toHaveBeenCalledWith("org-1", { opening_float: "100" });

    vi.mocked(cashApi.closeCashSession).mockResolvedValue(ok({ id: "cs-1" }));
    await runSuccess(() => useCloseCashSession(), {
      id: "cs-1",
      payload: { counted_total: "100" },
    });
    expect(cashApi.closeCashSession).toHaveBeenCalledWith("org-1", "cs-1", {
      counted_total: "100",
    });

    vi.mocked(cashApi.reconcileCashSession).mockRejectedValue(new Error("x"));
    await runError(() => useReconcileCashSession(), "cs-1");
    expect(toast.error).toHaveBeenCalled();
  });
});

describe("refund + receipt + report + service hooks", () => {
  it("useRefunds lists for an invoice", async () => {
    vi.mocked(refundsApi.fetchRefundsForInvoice).mockResolvedValue(ok([{ id: "rf-1" }]));
    const { result } = renderHook(() => useRefunds("inv-1"), {
      wrapper: wrapperFor(makeClient()),
    });
    await waitFor(() => expect(result.current.refunds).toEqual([{ id: "rf-1" }]));
  });

  it("useCreateRefund success + error and useVoidRefund success", async () => {
    vi.mocked(refundsApi.createRefund).mockResolvedValue(ok({ id: "rf-1" }));
    await runSuccess(() => useCreateRefund("inv-1"), { amount: "10" });
    expect(refundsApi.createRefund).toHaveBeenCalledWith("org-1", { amount: "10" });
    expect(toast.success).toHaveBeenCalled();

    vi.mocked(refundsApi.createRefund).mockRejectedValue(new Error("x"));
    await runError(() => useCreateRefund(), {});
    expect(toast.error).toHaveBeenCalled();

    vi.mocked(refundsApi.voidRefund).mockResolvedValue(ok(null));
    await runSuccess(() => useVoidRefund("inv-1"), "rf-1");
    expect(refundsApi.voidRefund).toHaveBeenCalledWith("org-1", "rf-1");
  });

  it("useReceipts and useReceiptPrint", async () => {
    vi.mocked(receiptsApi.fetchReceiptsForInvoice).mockResolvedValue(ok([{ id: "r-1" }]));
    const list = renderHook(() => useReceipts("inv-1"), {
      wrapper: wrapperFor(makeClient()),
    });
    await waitFor(() => expect(list.result.current.receipts).toEqual([{ id: "r-1" }]));

    vi.mocked(receiptsApi.fetchReceiptPrint).mockResolvedValue(ok({ id: "r-1" }));
    const print = renderHook(() => useReceiptPrint("r-1"), {
      wrapper: wrapperFor(makeClient()),
    });
    await waitFor(() => expect(print.result.current.receipt).toEqual({ id: "r-1" }));

    const disabled = renderHook(() => useReceiptPrint(undefined), {
      wrapper: wrapperFor(makeClient()),
    });
    expect(disabled.result.current.receipt).toBeNull();
  });

  it("useFinancialReport fetches and respects disabled", async () => {
    vi.mocked(reportingApi.fetchReport).mockResolvedValue(ok({ total: "5" }));
    const { result } = renderHook(
      () => useFinancialReport<{ total: string }>("revenue", { date_from: "2026-01-01" }),
      { wrapper: wrapperFor(makeClient()) },
    );
    await waitFor(() => expect(result.current.data).toEqual({ total: "5" }));
    expect(reportingApi.fetchReport).toHaveBeenCalled();

    const disabled = renderHook(
      () => useFinancialReport("revenue", undefined, { enabled: false }),
      { wrapper: wrapperFor(makeClient()) },
    );
    expect(disabled.result.current.data).toBeNull();
  });

  it("useToggleServiceActive activate + deactivate + error", async () => {
    vi.mocked(servicesApi.activateService).mockResolvedValue(ok(null));
    vi.mocked(servicesApi.deactivateService).mockResolvedValue(ok(null));
    await runSuccess(() => useToggleServiceActive(), { id: "svc-1", active: true });
    expect(servicesApi.activateService).toHaveBeenCalledWith("org-1", "svc-1");
    await runSuccess(() => useToggleServiceActive(), { id: "svc-1", active: false });
    expect(servicesApi.deactivateService).toHaveBeenCalledWith("org-1", "svc-1");

    vi.mocked(servicesApi.activateService).mockRejectedValue(new Error("x"));
    await runError(() => useToggleServiceActive(), { id: "svc-1", active: true });
    expect(toast.error).toHaveBeenCalled();
  });
});
