"use client";

import { Dialog } from "radix-ui";
import { Printer, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { formatMoney } from "../lib/format";
import type { EmbeddedPerson, Invoice } from "../types/financial.types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice;
  /** Display names when the response embeds them; fall back to ids. */
  patientName?: string;
  doctorName?: string;
};

function personName(p: EmbeddedPerson | null | undefined, fallback: string) {
  if (!p) return fallback;
  if (p.full_name) return p.full_name;
  return [p.first_name, p.last_name].filter(Boolean).join(" ").trim() || fallback;
}

function fmtDate(v: string | null | undefined) {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function InvoicePrintModal({
  open,
  onOpenChange,
  invoice,
  patientName,
  doctorName,
}: Props) {
  const tPrint = useTranslations("financial.invoice.print");
  const tItems = useTranslations("financial.invoice.lineItems");
  const tTotals = useTranslations("financial.invoice.totals");
  const tCommon = useTranslations("financial.common");
  const cur = invoice.currency;

  const itemDiscounts = invoice.items.reduce(
    (s, i) => s + (i.discount_amount ?? 0),
    0,
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/35 print:hidden" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-51 flex max-h-[88vh] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl bg-white shadow-2xl outline-none print:static print:translate-x-0 print:translate-y-0 print:max-h-none print:w-full print:rounded-none print:shadow-none">
          {/* Chrome */}
          <div className="flex items-center justify-between border-b border-gray-100 p-4 print:hidden">
            <Dialog.Title className="text-base font-medium text-gray-900">
              {tPrint("title")} {invoice.invoice_number}
            </Dialog.Title>
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => window.print()}>
                <Printer className="size-3.5" aria-hidden="true" />
                {tPrint("print")}
              </Button>
              <Dialog.Close className="rounded-lg p-1 text-gray-400 hover:bg-gray-50">
                <X className="size-5" aria-hidden="true" />
              </Dialog.Close>
            </div>
          </div>

          {/* Printable */}
          <div id="invoice-printable" className="overflow-y-auto p-8 text-sm">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-brand-black">
                  {tPrint("title")}
                </h1>
                <p className="mt-1 font-mono text-xs text-gray-500">
                  #{invoice.invoice_number}
                </p>
              </div>
              <InvoiceStatusBadge status={invoice.status} />
            </div>

            {/* Parties + dates */}
            <div className="mt-6 grid grid-cols-2 gap-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  {tPrint("billedTo")}
                </p>
                <p className="mt-1 font-medium text-gray-900">
                  {patientName ?? personName(invoice.patient, invoice.patient_id)}
                </p>
                {(doctorName || invoice.assigned_doctor_id) && (
                  <p className="mt-2 text-xs text-gray-500">
                    {tPrint("provider")}:{" "}
                    {doctorName ??
                      personName(invoice.doctor, invoice.assigned_doctor_id ?? "—")}
                  </p>
                )}
              </div>
              <div className="text-right text-xs text-gray-500">
                <DateLine label={tPrint("created")} value={fmtDate(invoice.created_at)} />
                <DateLine label={tPrint("issued")} value={fmtDate(invoice.issued_at)} />
                <DateLine label={tPrint("due")} value={fmtDate(invoice.due_date)} />
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
                {invoice.items.map((it) => (
                  <tr key={it.id} className="border-b border-gray-100">
                    <td className="py-2.5 text-gray-900">{it.description}</td>
                    <td className="py-2.5 text-center text-gray-600">{it.quantity}</td>
                    <td className="py-2.5 text-right text-gray-600">
                      {formatMoney(it.unit_price, cur)}
                    </td>
                    <td className="py-2.5 text-right text-gray-600">
                      {it.discount_amount ? formatMoney(it.discount_amount, cur) : "—"}
                    </td>
                    <td className="py-2.5 text-right font-medium text-gray-900">
                      {formatMoney(it.total_amount, cur)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="mt-4 flex justify-end">
              <div className="w-64 space-y-1.5">
                <TotalLine label={tTotals("subtotal")} value={formatMoney(invoice.subtotal, cur)} />
                {itemDiscounts > 0 && (
                  <TotalLine
                    label={tTotals("lineDiscounts")}
                    value={`-${formatMoney(itemDiscounts, cur)}`}
                  />
                )}
                {invoice.discount_amount > 0 && (
                  <TotalLine
                    label={tTotals("invoiceDiscount")}
                    value={`-${formatMoney(invoice.discount_amount, cur)}`}
                  />
                )}
                {invoice.tax_amount > 0 && (
                  <TotalLine label={tTotals("tax")} value={formatMoney(invoice.tax_amount, cur)} />
                )}
                <div className="my-1 border-t border-gray-200" />
                <TotalLine
                  label={tTotals("total")}
                  value={formatMoney(invoice.total_amount, cur)}
                  bold
                />
                <TotalLine label={tTotals("paid")} value={formatMoney(invoice.paid_amount, cur)} />
                <TotalLine
                  label={tTotals("balanceDue")}
                  value={formatMoney(invoice.balance_due, cur)}
                  bold
                />
              </div>
            </div>

            {invoice.notes && (
              <div className="mt-6 border-t border-dashed border-gray-200 pt-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  {tPrint("notes")}
                </p>
                <p className="mt-1 text-gray-600">{invoice.notes}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end border-t border-gray-100 p-4 print:hidden">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tCommon("close")}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
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
      <span className={bold ? "font-semibold text-gray-900" : "text-gray-500"}>
        {label}
      </span>
      <span className={bold ? "font-semibold text-gray-900" : "text-gray-700"}>
        {value}
      </span>
    </div>
  );
}
