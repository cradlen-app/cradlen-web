import type { DiscountType } from "../types/financial.types";

/** Minimal line-item shape needed for totals math. */
export type TotalsItem = {
  unit_price: number;
  quantity: number;
  discount_amount?: number | null;
};

export type ComputedTotals = {
  subtotal: number;
  lineDiscounts: number;
  invoiceDiscount: number;
  tax: number;
  total: number;
  paid: number;
  balance: number;
};

type ComputeOpts = {
  /** Authoritative server values when an invoice is already saved. */
  tax?: number;
  paid?: number;
  /** Server-computed balance; falls back to `total` when omitted (unsaved draft). */
  balance?: number;
};

/**
 * Derive invoice totals from line items + the invoice-level discount.
 *
 * Shared by `InvoiceTotalsPanel` and the live `InvoicePreview` so the editing
 * preview and the saved-invoice panel never diverge. Tax/paid/balance come from
 * the backend snapshot when present; for an unsaved draft they default to 0 and
 * `balance` falls back to the computed pre-tax/discount total.
 */
export function computeInvoiceTotals(
  items: TotalsItem[],
  discountType: DiscountType | "NONE" = "NONE",
  discountValue = 0,
  opts: ComputeOpts = {},
): ComputedTotals {
  const subtotal = items.reduce(
    (sum, it) => sum + (it.unit_price || 0) * (it.quantity || 0),
    0,
  );
  const lineDiscounts = items.reduce(
    (sum, it) => sum + (it.discount_amount ?? 0),
    0,
  );
  const afterLine = Math.max(subtotal - lineDiscounts, 0);

  let invoiceDiscount = 0;
  if (discountType === "PERCENTAGE") {
    invoiceDiscount = (afterLine * (discountValue || 0)) / 100;
  } else if (discountType === "FIXED") {
    invoiceDiscount = Math.min(discountValue || 0, afterLine);
  }

  const tax = opts.tax ?? 0;
  const total = Math.max(afterLine - invoiceDiscount + tax, 0);
  const paid = opts.paid ?? 0;
  const balance = opts.balance ?? total;

  return { subtotal, lineDiscounts, invoiceDiscount, tax, total, paid, balance };
}
