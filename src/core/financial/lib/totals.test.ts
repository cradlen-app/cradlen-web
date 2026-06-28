import { describe, expect, it } from "vitest";
import { computeInvoiceTotals, type TotalsItem } from "./totals";

const items: TotalsItem[] = [
  { unit_price: 100, quantity: 2, discount_amount: 10 }, // 200 - 10
  { unit_price: 50, quantity: 1 }, // 50, no line discount
];

describe("computeInvoiceTotals", () => {
  it("computes subtotal and line discounts", () => {
    const t = computeInvoiceTotals(items);
    expect(t.subtotal).toBe(250);
    expect(t.lineDiscounts).toBe(10);
  });

  it("defaults to no invoice discount, zero tax/paid, balance = total", () => {
    const t = computeInvoiceTotals(items);
    expect(t.invoiceDiscount).toBe(0);
    expect(t.tax).toBe(0);
    expect(t.paid).toBe(0);
    // subtotal 250 - line 10 = 240
    expect(t.total).toBe(240);
    expect(t.balance).toBe(240);
  });

  it("applies a PERCENTAGE invoice discount on the after-line amount", () => {
    const t = computeInvoiceTotals(items, "PERCENTAGE", 10);
    // afterLine = 240, 10% = 24
    expect(t.invoiceDiscount).toBe(24);
    expect(t.total).toBe(216);
  });

  it("applies a FIXED invoice discount capped at the after-line amount", () => {
    const t = computeInvoiceTotals(items, "FIXED", 1000);
    expect(t.invoiceDiscount).toBe(240); // capped at afterLine
    expect(t.total).toBe(0);
  });

  it("uses a FIXED discount smaller than the after-line amount as-is", () => {
    const t = computeInvoiceTotals(items, "FIXED", 40);
    expect(t.invoiceDiscount).toBe(40);
    expect(t.total).toBe(200);
  });

  it("layers server tax/paid/balance from opts", () => {
    const t = computeInvoiceTotals(items, "NONE", 0, {
      tax: 12,
      paid: 100,
      balance: 152,
    });
    expect(t.tax).toBe(12);
    expect(t.total).toBe(252); // 240 + 12
    expect(t.paid).toBe(100);
    expect(t.balance).toBe(152);
  });

  it("clamps line discounts so after-line is never negative", () => {
    const t = computeInvoiceTotals([{ unit_price: 10, quantity: 1, discount_amount: 999 }]);
    expect(t.subtotal).toBe(10);
    expect(t.lineDiscounts).toBe(999);
    expect(t.total).toBe(0);
  });

  it("treats missing/zero values defensively", () => {
    const t = computeInvoiceTotals([
      { unit_price: 0, quantity: 0 },
      { unit_price: 5, quantity: 3, discount_amount: null },
    ]);
    expect(t.subtotal).toBe(15);
    expect(t.lineDiscounts).toBe(0);
    expect(t.total).toBe(15);
  });

  it("handles an empty item list", () => {
    const t = computeInvoiceTotals([]);
    expect(t).toEqual({
      subtotal: 0,
      lineDiscounts: 0,
      invoiceDiscount: 0,
      tax: 0,
      total: 0,
      paid: 0,
      balance: 0,
    });
  });
});
