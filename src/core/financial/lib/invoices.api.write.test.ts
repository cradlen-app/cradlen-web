import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiAuthFetch } from "@/infrastructure/http/api";
import {
  appendChargesToInvoice,
  buildInvoiceFromCharges,
  createInvoice,
  fetchInvoice,
  fetchPayments,
  issueInvoice,
  recordPayment,
  updateInvoice,
  voidInvoice,
  voidPayment,
} from "./invoices.api";

vi.mock("@/infrastructure/http/api", () => ({
  apiAuthFetch: vi.fn(),
}));

const mockFetch = vi.mocked(apiAuthFetch);
const BASE = "/organizations/org-1/invoices";

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockResolvedValue({ data: {}, meta: {} });
});

describe("read normalization", () => {
  it("fetchInvoice coerces string decimals into numbers across the invoice tree", async () => {
    mockFetch.mockResolvedValue({
      data: {
        id: "inv-1",
        subtotal: "100.5",
        discount_value: "5",
        discount_amount: "5",
        tax_amount: "10",
        total_amount: "105.5",
        paid_amount: "0",
        balance_due: "105.5",
        items: [
          { id: "it-1", unit_price: "50.25", discount_amount: "1", total_amount: "99.5" },
        ],
        payments: [{ id: "pay-1", amount: "20" }],
      },
      meta: {},
    });

    const res = await fetchInvoice("org-1", "inv-1");
    expect(mockFetch).toHaveBeenCalledWith(`${BASE}/inv-1`);
    expect(res.data.subtotal).toBe(100.5);
    expect(res.data.discount_value).toBe(5);
    expect(res.data.total_amount).toBe(105.5);
    expect(res.data.items[0].unit_price).toBe(50.25);
    expect(res.data.items[0].total_amount).toBe(99.5);
    expect(res.data.payments?.[0].amount).toBe(20);
  });

  it("fetchInvoice preserves a null discount_value", async () => {
    mockFetch.mockResolvedValue({
      data: {
        id: "inv-1",
        subtotal: "0",
        discount_value: null,
        discount_amount: "0",
        tax_amount: "0",
        total_amount: "0",
        paid_amount: "0",
        balance_due: "0",
        items: [],
      },
      meta: {},
    });
    const res = await fetchInvoice("org-1", "inv-1");
    expect(res.data.discount_value).toBeNull();
    expect(res.data.items).toEqual([]);
  });

  it("fetchPayments normalizes payment amounts", async () => {
    mockFetch.mockResolvedValue({
      data: [{ id: "pay-1", amount: "33.3" }],
      meta: {},
    });
    const res = await fetchPayments("org-1", "inv-1");
    expect(mockFetch).toHaveBeenCalledWith(`${BASE}/inv-1/payments`);
    expect(res.data[0].amount).toBe(33.3);
  });
});

describe("write operations", () => {
  it("createInvoice POSTs the payload", async () => {
    const payload = { patient_id: "p-1" } as never;
    await createInvoice("org-1", payload);
    expect(mockFetch).toHaveBeenCalledWith(BASE, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  });

  it("buildInvoiceFromCharges POSTs to from-charges", async () => {
    const payload = { charge_ids: ["c-1"] } as never;
    await buildInvoiceFromCharges("org-1", payload);
    expect(mockFetch).toHaveBeenCalledWith(`${BASE}/from-charges`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  });

  it("appendChargesToInvoice POSTs to the append-charges sub-path", async () => {
    const payload = { charge_ids: ["c-2"] } as never;
    await appendChargesToInvoice("org-1", "inv-1", payload);
    expect(mockFetch).toHaveBeenCalledWith(`${BASE}/inv-1/append-charges`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  });

  it("updateInvoice PATCHes by id", async () => {
    const payload = { notes: "x" } as never;
    await updateInvoice("org-1", "inv-1", payload);
    expect(mockFetch).toHaveBeenCalledWith(`${BASE}/inv-1`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  });

  it("issueInvoice and voidInvoice POST to their sub-paths", async () => {
    await issueInvoice("org-1", "inv-1");
    expect(mockFetch).toHaveBeenCalledWith(`${BASE}/inv-1/issue`, { method: "POST" });
    await voidInvoice("org-1", "inv-1");
    expect(mockFetch).toHaveBeenCalledWith(`${BASE}/inv-1/void`, { method: "POST" });
  });

  it("recordPayment POSTs the payload to the payments collection", async () => {
    const payload = { amount: 50, payment_method: "CASH" } as never;
    await recordPayment("org-1", "inv-1", payload);
    expect(mockFetch).toHaveBeenCalledWith(`${BASE}/inv-1/payments`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  });

  it("voidPayment POSTs to the payment void sub-path", async () => {
    await voidPayment("org-1", "inv-1", "pay-1");
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE}/inv-1/payments/pay-1/void`,
      { method: "POST" },
    );
  });
});
