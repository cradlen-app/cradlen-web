"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import { formatDateLong as formatDate, personName } from "../lib/format";
import type { Invoice } from "../types/financial.types";

type Props = {
  invoice: Invoice;
  /** Compact, single-surface layout for the narrow master-detail panel. */
  dense?: boolean;
};

/** The left-column metadata card: patient, doctor, type, dates, notes. */
export function InvoiceDetailsCard({ invoice, dense = false }: Props) {
  const t = useTranslations("financial.invoice");

  return (
    <div
      className={cn(
        dense
          ? "min-w-0 border-t border-gray-100 pt-4"
          : "rounded-2xl border border-gray-200 bg-white p-5 shadow-sm",
      )}
    >
      <h2 className="mb-4 text-sm font-semibold text-gray-700">
        {t("view.invoiceDetails")}
      </h2>
      <dl className="space-y-3 text-sm">
        {invoice.patient_id && (
          <Field label={t("fields.patient")} dense={dense}>
            {personName(invoice.patient, invoice.patient_id)}
          </Field>
        )}

        {invoice.assigned_doctor_id && (
          <Field label={t("fields.doctor")} dense={dense}>
            {personName(invoice.doctor, invoice.assigned_doctor_id)}
          </Field>
        )}

        <Field label={t("fields.type")} dense={dense}>
          {t(`types.${invoice.invoice_type}`)}
        </Field>

        {invoice.issued_at && (
          <Field label={t("fields.issued")} dense={dense}>
            {formatDate(invoice.issued_at)}
          </Field>
        )}

        {invoice.due_date && (
          <Field label={t("fields.dueDate")} dense={dense}>
            {formatDate(invoice.due_date)}
          </Field>
        )}

        {invoice.notes && (
          <div className="border-t border-gray-100 pt-3">
            <dt className="mb-1 text-gray-500">{t("fields.notes")}</dt>
            <dd className="break-words text-gray-900">{invoice.notes}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

function Field({
  label,
  dense,
  children,
}: {
  label: string;
  dense?: boolean;
  children: React.ReactNode;
}) {
  // Dense stacks label-over-value so long names wrap instead of clipping; the
  // roomy page layout keeps the original label/value row.
  if (dense) {
    return (
      <div className="min-w-0">
        <dt className="text-xs text-gray-500">{label}</dt>
        <dd className="break-words font-medium text-gray-900">{children}</dd>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-2">
      <dt className="shrink-0 text-gray-500">{label}</dt>
      <dd className="min-w-0 text-right font-medium text-gray-900">
        <span className="block break-words">{children}</span>
      </dd>
    </div>
  );
}
