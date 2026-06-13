"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import { formatMoney, formatDateLong } from "../lib/format";
import { computeInvoiceTotals } from "../lib/totals";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import type { DiscountType, InvoiceStatus } from "../types/financial.types";

export type InvoicePreviewItem = {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_amount?: number | null;
};

export type InvoicePreviewModel = {
  /** null/undefined → shows the "assigned on save" placeholder. */
  invoiceNumber?: string | null;
  status?: InvoiceStatus;
  patientName: string;
  /** Rendered as "Provider". */
  doctorName?: string;
  /** ISO date; for a new draft pass today. */
  issueDate?: string | null;
  dueDate?: string | null;
  currency: string;
  items: InvoicePreviewItem[];
  discountType?: DiscountType | "NONE";
  discountValue?: number;
  /** Backend-computed; 0 for an unsaved draft. */
  taxAmount?: number;
  /** View mode only — omit to hide the Paid/Balance rows. */
  paidAmount?: number;
  balanceDue?: number;
  notes?: string | null;
};

/**
 * Presentational, formatted invoice render driven by a view-model (not a full
 * `Invoice`). Used both as the live preview in the create/edit drawer and as the
 * printable body inside `InvoicePrintModal`. Totals come from the shared
 * `computeInvoiceTotals` so the preview never diverges from the saved invoice.
 */
export function InvoicePreview({
  invoiceNumber,
  status,
  patientName,
  doctorName,
  issueDate,
  dueDate,
  currency,
  items,
  discountType = "NONE",
  discountValue = 0,
  taxAmount = 0,
  paidAmount,
  balanceDue,
  notes,
}: InvoicePreviewModel) {
  const tPrint = useTranslations("financial.invoice.print");
  const tItems = useTranslations("financial.invoice.lineItems");
  const tTotals = useTranslations("financial.invoice.totals");
  const tPreview = useTranslations("financial.invoice.preview");

  const showPaid = paidAmount != null;
  const calc = computeInvoiceTotals(items, discountType, discountValue, {
    tax: taxAmount,
    paid: paidAmount,
    balance: balanceDue,
  });

  return (
    <div className="text-sm">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-brand-black">
            {tPrint("title")}
          </h1>
          <p className="mt-1 font-mono text-xs text-gray-500">
            {invoiceNumber ? `#${invoiceNumber}` : tPreview("numberPending")}
          </p>
        </div>
        {status && <InvoiceStatusBadge status={status} />}
      </div>

      {/* Parties + dates */}
      <div className="mt-6 grid grid-cols-2 gap-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            {tPrint("billedTo")}
          </p>
          <p className="mt-1 font-medium text-gray-900">
            {patientName || "—"}
          </p>
          {doctorName && (
            <p className="mt-2 text-xs text-gray-500">
              {tPrint("provider")}: {doctorName}
            </p>
          )}
        </div>
        <div className="text-right text-xs text-gray-500">
          <DateLine label={tPrint("issued")} value={formatDateLong(issueDate)} />
          <DateLine label={tPrint("due")} value={formatDateLong(dueDate)} />
        </div>
      </div>

      {/* Items */}
      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-y border-gray-200 text-xs text-gray-500">
            <th className="py-2 text-left font-medium">{tItems("header")}</th>
            <th className="py-2 text-center font-medium">{tItems("qty")}</th>
            <th className="py-2 text-right font-medium">{tItems("unitPrice")}</th>
            <th className="py-2 text-right font-medium">{tItems("discount")}</th>
            <th className="py-2 text-right font-medium">{tItems("total")}</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="py-8 text-center text-sm text-gray-400"
              >
                {tItems("noItems")}
              </td>
            </tr>
          ) : (
            items.map((it, idx) => {
              const lineTotal =
                (it.unit_price || 0) * (it.quantity || 0) -
                (it.discount_amount ?? 0);
              return (
                <tr key={it.id ?? idx} className="border-b border-gray-100">
                  <td className="py-2.5 text-gray-900">
                    {it.description || "—"}
                  </td>
                  <td className="py-2.5 text-center text-gray-600">
                    {it.quantity}
                  </td>
                  <td className="py-2.5 text-right text-gray-600">
                    {formatMoney(it.unit_price, currency)}
                  </td>
                  <td className="py-2.5 text-right text-gray-600">
                    {it.discount_amount
                      ? formatMoney(it.discount_amount, currency)
                      : "—"}
                  </td>
                  <td className="py-2.5 text-right font-medium text-gray-900">
                    {formatMoney(Math.max(lineTotal, 0), currency)}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Totals */}
      <div className="mt-4 flex justify-end">
        <div className="w-64 space-y-1.5">
          <TotalLine
            label={tTotals("subtotal")}
            value={formatMoney(calc.subtotal, currency)}
          />
          {calc.lineDiscounts > 0 && (
            <TotalLine
              label={tTotals("lineDiscounts")}
              value={`-${formatMoney(calc.lineDiscounts, currency)}`}
            />
          )}
          {calc.invoiceDiscount > 0 && (
            <TotalLine
              label={tTotals("invoiceDiscount")}
              value={`-${formatMoney(calc.invoiceDiscount, currency)}`}
            />
          )}
          {calc.tax > 0 && (
            <TotalLine
              label={tTotals("tax")}
              value={formatMoney(calc.tax, currency)}
            />
          )}
          <div className="my-1 border-t border-gray-200" />
          <TotalLine
            label={tTotals("total")}
            value={formatMoney(calc.total, currency)}
            bold
          />
          {showPaid && (
            <>
              <TotalLine
                label={tTotals("paid")}
                value={formatMoney(calc.paid, currency)}
              />
              <TotalLine
                label={tTotals("balanceDue")}
                value={formatMoney(calc.balance, currency)}
                bold
              />
            </>
          )}
        </div>
      </div>

      {notes && (
        <div className="mt-6 border-t border-dashed border-gray-200 pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            {tPrint("notes")}
          </p>
          <p className="mt-1 text-gray-600">{notes}</p>
        </div>
      )}
    </div>
  );
}

function DateLine({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="text-gray-400">{label}: </span>
      <span className="text-gray-700">{value}</span>
    </p>
  );
}

function TotalLine({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn(bold ? "font-semibold text-gray-900" : "text-gray-500")}>
        {label}
      </span>
      <span className={cn(bold ? "font-semibold text-gray-900" : "text-gray-700")}>
        {value}
      </span>
    </div>
  );
}
