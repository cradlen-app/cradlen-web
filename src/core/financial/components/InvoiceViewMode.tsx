"use client";

import {
  Ban,
  CreditCard,
  FilePlus2,
  Loader2,
  Pencil,
  Printer,
  Send,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { InvoiceTotalsPanel } from "./InvoiceTotalsPanel";
import { InvoicePaymentsPanel } from "./InvoicePaymentsPanel";
import { formatMoney, personName } from "../lib/format";
import type { Invoice } from "../types/financial.types";

type InvoiceViewModeProps = {
  invoice: Invoice;
  /** Prefill display names, preferred over deriving from the invoice payload. */
  patientName?: string;
  doctorName?: string;
  canVoid: boolean;
  canEdit: boolean;
  canIssue: boolean;
  canAppendCharges: boolean;
  canRecordPayment: boolean;
  pendingChargeCount: number;
  issuing: boolean;
  appending: boolean;
  onPrint: () => void;
  onVoid: () => void;
  onEdit: () => void;
  onIssue: () => void;
  onAppendCharges: () => void;
  onRecordPayment: () => void;
};

/**
 * Read-only invoice view with the action footer (print / void / edit / issue /
 * append-charges / record-payment). Extracted from `InvoiceDrawer` as the
 * non-edit half of the drawer body; all mutations stay owned by the drawer and
 * are invoked through the callbacks.
 */
export function InvoiceViewMode({
  invoice,
  patientName,
  doctorName,
  canVoid,
  canEdit,
  canIssue,
  canAppendCharges,
  canRecordPayment,
  pendingChargeCount,
  issuing,
  appending,
  onPrint,
  onVoid,
  onEdit,
  onIssue,
  onAppendCharges,
  onRecordPayment,
}: InvoiceViewModeProps) {
  const t = useTranslations("financial.invoice");

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="flex-1 px-6 py-5">
        {/* Info rows */}
        <dl className="grid grid-cols-2 gap-4 text-sm">
          {invoice.patient_id && (
            <>
              <dt className="text-gray-500">{t("fields.patient")}</dt>
              <dd className="font-medium text-gray-900">
                {patientName ?? personName(invoice.patient, invoice.patient_id)}
              </dd>
            </>
          )}
          {(doctorName || invoice.assigned_doctor_id) && (
            <>
              <dt className="text-gray-500">{t("fields.doctor")}</dt>
              <dd className="font-medium text-gray-900">
                {doctorName ??
                  personName(invoice.doctor, invoice.assigned_doctor_id ?? "")}
              </dd>
            </>
          )}
          {invoice.visit_id && (
            <>
              <dt className="text-gray-500">{t("fields.visitId")}</dt>
              <dd className="font-medium text-gray-900">{invoice.visit_id}</dd>
            </>
          )}
          <dt className="text-gray-500">{t("fields.type")}</dt>
          <dd className="font-medium text-gray-900">
            {t(`types.${invoice.invoice_type}`)}
          </dd>
          {invoice.due_date && (
            <>
              <dt className="text-gray-500">{t("fields.dueDate")}</dt>
              <dd className="font-medium text-gray-900">
                {new Date(invoice.due_date).toLocaleDateString("en-US")}
              </dd>
            </>
          )}
          {invoice.notes && (
            <>
              <dt className="text-gray-500">{t("fields.notes")}</dt>
              <dd className="font-medium text-gray-900">{invoice.notes}</dd>
            </>
          )}
        </dl>

        {/* Line items */}
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">{t("view.lineItems")}</h3>
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
                  <th className="px-4 py-2 text-left font-medium">{t("lineItems.service")}</th>
                  <th className="px-4 py-2 text-center font-medium">{t("lineItems.qty")}</th>
                  <th className="px-4 py-2 text-right font-medium">{t("lineItems.unitPrice")}</th>
                  <th className="px-4 py-2 text-right font-medium">{t("lineItems.discount")}</th>
                  <th className="px-4 py-2 text-right font-medium">{t("lineItems.total")}</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-50 last:border-0"
                  >
                    <td className="px-4 py-3 text-gray-900">{item.description}</td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {formatMoney(item.unit_price, invoice.currency)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {item.discount_amount
                        ? formatMoney(item.discount_amount, invoice.currency)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatMoney(item.total_amount, invoice.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="mt-4 flex justify-end">
          <InvoiceTotalsPanel
            items={invoice.items}
            currency={invoice.currency}
            discountType={invoice.discount_type ?? "NONE"}
            discountValue={invoice.discount_value ?? 0}
            invoice={invoice}
            className="w-72"
          />
        </div>

        {/* Payments */}
        {invoice.status !== "DRAFT" && (
          <div className="mt-6">
            <InvoicePaymentsPanel
              invoiceId={invoice.id}
              currency={invoice.currency}
            />
          </div>
        )}
      </div>

      {/* Action footer */}
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 px-6 py-4">
        <Button type="button" variant="outline" size="sm" onClick={onPrint}>
          <Printer className="size-3.5" aria-hidden="true" />
          {t("actions.printInvoice")}
        </Button>
        {canVoid && (
          <Button type="button" variant="destructive" size="sm" onClick={onVoid}>
            <Ban className="size-3.5" aria-hidden="true" />
            {t("actions.voidShort")}
          </Button>
        )}
        {canEdit && (
          <Button type="button" variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="size-3.5" aria-hidden="true" />
            {t("actions.edit")}
          </Button>
        )}
        {canIssue && (
          <Button type="button" size="sm" onClick={onIssue} disabled={issuing}>
            {issuing ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="size-3.5" aria-hidden="true" />
            )}
            {t("actions.issue")}
          </Button>
        )}
        {canAppendCharges && pendingChargeCount > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAppendCharges}
            disabled={appending}
          >
            {appending ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <FilePlus2 className="size-3.5" aria-hidden="true" />
            )}
            {t("actions.addChargesToInvoice", { count: pendingChargeCount })}
          </Button>
        )}
        {canRecordPayment && (
          <Button type="button" size="sm" onClick={onRecordPayment}>
            <CreditCard className="size-3.5" aria-hidden="true" />
            {t("actions.recordPayment")}
          </Button>
        )}
      </div>
    </div>
  );
}
