"use client";

import { useTranslations } from "next-intl";
import { formatDateLong as formatDate, personName } from "../lib/format";
import type { Invoice } from "../types/financial.types";

type Props = {
  invoice: Invoice;
};

/** The left-column metadata card: patient, doctor, type, dates, notes. */
export function InvoiceDetailsCard({ invoice }: Props) {
  const t = useTranslations("financial.invoice");

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-gray-700">
        {t("view.invoiceDetails")}
      </h2>
      <dl className="space-y-3 text-sm">
        {invoice.patient_id && (
          <Field label={t("fields.patient")}>
            {personName(invoice.patient, invoice.patient_id)}
          </Field>
        )}

        {invoice.assigned_doctor_id && (
          <Field label={t("fields.doctor")}>
            {personName(invoice.doctor, invoice.assigned_doctor_id)}
          </Field>
        )}

        <Field label={t("fields.type")}>{t(`types.${invoice.invoice_type}`)}</Field>

        {invoice.issued_at && (
          <Field label={t("fields.issued")}>{formatDate(invoice.issued_at)}</Field>
        )}

        {invoice.due_date && (
          <Field label={t("fields.dueDate")}>{formatDate(invoice.due_date)}</Field>
        )}

        {invoice.notes && (
          <div className="border-t border-gray-100 pt-3">
            <dt className="mb-1 text-gray-500">{t("fields.notes")}</dt>
            <dd className="text-gray-900">{invoice.notes}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <dt className="shrink-0 text-gray-500">{label}</dt>
      <dd className="text-right font-medium text-gray-900">
        <span className="block">{children}</span>
      </dd>
    </div>
  );
}
