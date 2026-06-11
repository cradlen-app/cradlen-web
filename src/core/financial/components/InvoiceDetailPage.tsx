"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChevronRight,
  Loader2,
  Ban,
  Pencil,
  Send,
  CreditCard,
  FileText,
  Receipt,
  Undo2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import { Button } from "@/components/ui/button";
import { useInvoice } from "../hooks/useInvoice";
import { usePayments } from "../hooks/usePayments";
import { useIssueInvoice } from "../hooks/useIssueInvoice";
import { useReceipts } from "../hooks/useReceipts";
import { useRefunds, useVoidRefund } from "../hooks/useRefunds";
import { useVoidPayment } from "../hooks/useVoidPayment";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { InvoicePricingSourceBadge } from "./InvoicePricingSourceBadge";
import { InvoiceTotalsPanel } from "./InvoiceTotalsPanel";
import { RecordPaymentDrawer } from "./RecordPaymentDrawer";
import { RefundDrawer } from "./RefundDrawer";
import { ReceiptPrintModal } from "./ReceiptPrintModal";
import { ConfirmDialog } from "./ConfirmDialog";
import { VoidInvoiceDialog } from "./VoidInvoiceDialog";
import { InvoiceDrawer } from "./InvoiceDrawer";
import { formatMoney } from "../lib/format";
import type { EmbeddedPerson, Payment, Refund } from "../types/financial.types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Best-effort display name from an optional nested person relation. Falls back
 * to the raw UUID when the backend response doesn't include the relation.
 */
function personName(
  person: EmbeddedPerson | null | undefined,
  fallback: string,
): string {
  if (!person) return fallback;
  if (person.full_name) return person.full_name;
  const composed = [person.first_name, person.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return composed || fallback;
}

// ── Loading Skeleton ──────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-7 w-48 animate-pulse rounded-lg bg-gray-100" />
            <div className="h-5 w-24 animate-pulse rounded-full bg-gray-100" />
            <div className="h-4 w-36 animate-pulse rounded-lg bg-gray-100" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-100" />
            <div className="h-9 w-32 animate-pulse rounded-lg bg-gray-100" />
          </div>
        </div>
      </div>
      {/* Body skeleton */}
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-gray-100 mt-2" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  invoiceId: string;
};

// ── Component ─────────────────────────────────────────────────────────────────

export function InvoiceDetailPage({ invoiceId }: Props) {
  const t = useTranslations("financial.invoice");
  const tPay = useTranslations("financial.payments");
  const tCommon = useTranslations("financial.common");
  const tRefund = useTranslations("financial.refund");
  const tReceipt = useTranslations("financial.receipt");
  const params = useParams<{ locale: string; orgId: string; branchId: string }>();
  const locale = params?.locale ?? "";
  const orgId = params?.orgId ?? "";
  const branchId = params?.branchId ?? "";

  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [refundTarget, setRefundTarget] = useState<Payment | null>(null);
  const [printReceiptId, setPrintReceiptId] = useState<string | null>(null);
  const [voidPaymentTarget, setVoidPaymentTarget] = useState<Payment | null>(null);
  const [voidRefundTarget, setVoidRefundTarget] = useState<Refund | null>(null);

  const { invoice, isLoading } = useInvoice(invoiceId);
  const { payments, isLoading: paymentsLoading } = usePayments(invoiceId);
  const { receipts } = useReceipts(invoiceId);
  const { refunds } = useRefunds(invoiceId);
  const voidPaymentMutation = useVoidPayment(invoiceId);
  const voidRefundMutation = useVoidRefund(invoiceId);
  const issueMutation = useIssueInvoice();

  // payment_id → receipt, for surfacing a "Receipt" action per payment row.
  const receiptByPayment = new Map(receipts.map((r) => [r.payment_id, r]));

  // Status-based permissions (mirroring InvoiceDrawer view mode)
  const canEdit = invoice?.status === "DRAFT";
  const canIssue = invoice?.status === "DRAFT";
  const canRecordPayment =
    invoice?.status === "ISSUED" || invoice?.status === "PARTIALLY_PAID";
  const canVoid = invoice?.status === "DRAFT";
  const isPartiallyPaid = invoice?.status === "PARTIALLY_PAID";

  // Base dashboard path
  const dashboardBase = `/${locale}/${orgId}/${branchId}/dashboard`;
  const invoicesHref = `${dashboardBase}/financial/invoices`;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-full bg-gray-50/50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-gray-500">
          <Link
            href={invoicesHref}
            className="transition-colors hover:text-gray-900"
          >
            {t("view.breadcrumbInvoices")}
          </Link>
          <ChevronRight className="size-4 shrink-0 text-gray-400" aria-hidden="true" />
          <span className="font-medium text-gray-900">
            {invoice ? invoice.invoice_number : tCommon("loading")}
          </span>
        </nav>

        {/* Loading state */}
        {isLoading && <DetailSkeleton />}

        {/* Error state */}
        {!isLoading && !invoice && (
          <div className="flex h-96 items-center justify-center text-sm text-gray-500">
            {t("view.notFound")}
          </div>
        )}

        {/* Content */}
        {!isLoading && invoice && (
          <>
            {/* Header card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                {/* Left: identity */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <FileText className="size-5 text-gray-400" aria-hidden="true" />
                      <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                        {invoice.invoice_number}
                      </h1>
                    </div>
                    <InvoiceStatusBadge status={invoice.status} />
                  </div>
                  <p className="text-sm text-gray-500">
                    {t("view.createdOn", { date: formatDate(invoice.created_at) })}
                  </p>
                  {/* Remaining balance */}
                  {invoice.total_amount - invoice.paid_amount > 0 && (
                    <p
                      className={cn(
                        "text-sm font-medium",
                        isPartiallyPaid ? "text-amber-600" : "text-gray-600",
                      )}
                    >
                      {t("view.balanceDue", {
                        amount: formatMoney(
                          invoice.total_amount - invoice.paid_amount,
                          invoice.currency,
                        ),
                      })}
                    </p>
                  )}
                </div>

                {/* Right: action buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {canVoid && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => setVoidDialogOpen(true)}
                    >
                      <Ban className="size-3.5" aria-hidden="true" />
                      {t("actions.voidShort")}
                    </Button>
                  )}
                  {canEdit && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditDrawerOpen(true)}
                    >
                      <Pencil className="size-3.5" aria-hidden="true" />
                      {t("actions.edit")}
                    </Button>
                  )}
                  {canIssue && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => issueMutation.mutate(invoice.id)}
                      disabled={issueMutation.isPending}
                    >
                      {issueMutation.isPending ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Send className="size-3.5" aria-hidden="true" />
                      )}
                      {t("actions.issue")}
                    </Button>
                  )}
                  {canRecordPayment && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setRecordPaymentOpen(true)}
                    >
                      <CreditCard className="size-3.5" aria-hidden="true" />
                      {t("actions.recordPayment")}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Two-column body */}
            <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
              {/* Left: metadata card */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-sm font-semibold text-gray-700">
                  {t("view.invoiceDetails")}
                </h2>
                <dl className="space-y-3 text-sm">
                  {/* Patient */}
                  {invoice.patient_id && (
                    <div className="flex items-start justify-between gap-2">
                      <dt className="shrink-0 text-gray-500">{t("fields.patient")}</dt>
                      <dd className="text-right font-medium text-gray-900">
                        <span className="block">
                          {personName(invoice.patient, invoice.patient_id)}
                        </span>
                      </dd>
                    </div>
                  )}

                  {/* Doctor */}
                  {invoice.assigned_doctor_id && (
                    <div className="flex items-start justify-between gap-2">
                      <dt className="shrink-0 text-gray-500">{t("fields.doctor")}</dt>
                      <dd className="text-right font-medium text-gray-900">
                        <span className="block">
                          {personName(
                            invoice.doctor,
                            invoice.assigned_doctor_id,
                          )}
                        </span>
                      </dd>
                    </div>
                  )}

                  {/* Invoice type */}
                  <div className="flex items-start justify-between gap-2">
                    <dt className="shrink-0 text-gray-500">{t("fields.type")}</dt>
                    <dd className="text-right font-medium text-gray-900">
                      {t(`types.${invoice.invoice_type}`)}
                    </dd>
                  </div>

                  {/* Issue date */}
                  {invoice.issued_at && (
                    <div className="flex items-start justify-between gap-2">
                      <dt className="shrink-0 text-gray-500">{t("fields.issued")}</dt>
                      <dd className="text-right font-medium text-gray-900">
                        {formatDate(invoice.issued_at)}
                      </dd>
                    </div>
                  )}

                  {/* Due date */}
                  {invoice.due_date && (
                    <div className="flex items-start justify-between gap-2">
                      <dt className="shrink-0 text-gray-500">{t("fields.dueDate")}</dt>
                      <dd className="text-right font-medium text-gray-900">
                        {formatDate(invoice.due_date)}
                      </dd>
                    </div>
                  )}

                  {/* Notes */}
                  {invoice.notes && (
                    <div className="border-t border-gray-100 pt-3">
                      <dt className="mb-1 text-gray-500">{t("fields.notes")}</dt>
                      <dd className="text-gray-900">{invoice.notes}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Right: line items + payments */}
              <div className="space-y-6">
                {/* Line items table */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h2 className="mb-4 text-sm font-semibold text-gray-700">
                    {t("view.lineItems")}
                  </h2>
                  <div className="overflow-x-auto rounded-xl border border-gray-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
                          <th className="px-4 py-2.5 text-left font-medium">
                            {t("lineItems.description")}
                          </th>
                          <th className="px-4 py-2.5 text-center font-medium">
                            {t("lineItems.qty")}
                          </th>
                          <th className="px-4 py-2.5 text-right font-medium">
                            {t("lineItems.unitPrice")}
                          </th>
                          <th className="px-4 py-2.5 text-left font-medium">
                            {t("lineItems.pricingSource")}
                          </th>
                          <th className="px-4 py-2.5 text-right font-medium">
                            {t("lineItems.discount")}
                          </th>
                          <th className="px-4 py-2.5 text-right font-medium">
                            {t("lineItems.total")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.items.map((item) => (
                          <tr
                            key={item.id}
                            className="border-b border-gray-50 last:border-0"
                          >
                            <td className="px-4 py-3 text-gray-900">
                              {item.description}
                            </td>
                            <td className="px-4 py-3 text-center text-gray-600">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-600">
                              {formatMoney(item.unit_price, invoice.currency)}
                            </td>
                            <td className="px-4 py-3">
                              <InvoicePricingSourceBadge
                                source={item.pricing_source}
                              />
                            </td>
                            <td className="px-4 py-3 text-right text-gray-600">
                              {item.discount_amount
                                ? formatMoney(
                                    item.discount_amount,
                                    invoice.currency,
                                  )
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

                  {/* Totals */}
                  <div className="mt-4 flex justify-end">
                    <InvoiceTotalsPanel
                      items={invoice.items}
                      currency={invoice.currency}
                      className="w-72"
                    />
                  </div>
                </div>

                {/* Payment history table */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h2 className="mb-4 text-sm font-semibold text-gray-700">
                    {t("view.paymentHistory")}
                  </h2>

                  {paymentsLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-10 animate-pulse rounded-lg bg-gray-100"
                        />
                      ))}
                    </div>
                  ) : payments.length === 0 ? (
                    <p className="py-6 text-center text-sm text-gray-400">
                      {t("view.noPayments")}
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
                            <th className="px-4 py-2.5 text-left font-medium">
                              {t("payments.date")}
                            </th>
                            <th className="px-4 py-2.5 text-right font-medium">
                              {t("payments.amount")}
                            </th>
                            <th className="px-4 py-2.5 text-left font-medium">
                              {t("payments.method")}
                            </th>
                            <th className="px-4 py-2.5 text-left font-medium">
                              {t("payments.reference")}
                            </th>
                            <th className="px-4 py-2.5 text-left font-medium">
                              {t("payments.recordedBy")}
                            </th>
                            <th className="px-4 py-2.5 text-right font-medium">
                              {t("payments.actionsColumn")}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...payments]
                            .sort(
                              (a, b) =>
                                new Date(b.payment_date).getTime() -
                                new Date(a.payment_date).getTime(),
                            )
                            .map((payment) => (
                              <tr
                                key={payment.id}
                                className="border-b border-gray-50 last:border-0"
                              >
                                <td className="px-4 py-3 text-gray-600">
                                  {formatDate(payment.payment_date)}
                                </td>
                                <td className="px-4 py-3 text-right font-medium text-gray-900">
                                  {formatMoney(payment.amount, payment.currency)}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                  {tPay(`method.${payment.payment_method}`)}
                                </td>
                                <td className="px-4 py-3 text-gray-500">
                                  {payment.reference_number ?? "—"}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                  {personName(
                                    payment.recorded_by,
                                    payment.recorded_by_id,
                                  )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {receiptByPayment.has(payment.id) && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setPrintReceiptId(
                                            receiptByPayment.get(payment.id)!.id,
                                          )
                                        }
                                        className="inline-flex h-7 items-center gap-1 rounded-lg border border-gray-200 px-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
                                      >
                                        <Receipt className="size-3.5" aria-hidden="true" />
                                        {tReceipt("action")}
                                      </button>
                                    )}
                                    {payment.status === "COMPLETED" && (
                                      <button
                                        type="button"
                                        onClick={() => setRefundTarget(payment)}
                                        className="inline-flex h-7 items-center gap-1 rounded-lg border border-gray-200 px-2 text-xs font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
                                      >
                                        <Undo2 className="size-3.5" aria-hidden="true" />
                                        {tRefund("action")}
                                      </button>
                                    )}
                                    {(payment.status === "COMPLETED" ||
                                      payment.status === "PENDING") && (
                                      <button
                                        type="button"
                                        onClick={() => setVoidPaymentTarget(payment)}
                                        className="inline-flex h-7 items-center gap-1 rounded-lg border border-gray-200 px-2 text-xs font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
                                      >
                                        <Ban className="size-3.5" aria-hidden="true" />
                                        {tPay("voidAction")}
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Refunds */}
                {refunds.length > 0 && (
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <h2 className="mb-4 text-sm font-semibold text-gray-700">
                      {tRefund("header")}
                    </h2>
                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
                            <th className="px-4 py-2.5 text-left font-medium">
                              {t("payments.date")}
                            </th>
                            <th className="px-4 py-2.5 text-right font-medium">
                              {tRefund("amount")}
                            </th>
                            <th className="px-4 py-2.5 text-left font-medium">
                              {tRefund("reasonLabel")}
                            </th>
                            <th className="px-4 py-2.5 text-left font-medium">
                              {t("payments.method")}
                            </th>
                            <th className="px-4 py-2.5 text-right font-medium">
                              {t("payments.actionsColumn")}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {refunds.map((refund) => (
                            <tr
                              key={refund.id}
                              className="border-b border-gray-50 last:border-0"
                            >
                              <td className="px-4 py-3 text-gray-600">
                                {formatDate(refund.refunded_at)}
                              </td>
                              <td className="px-4 py-3 text-right font-medium text-gray-900">
                                {formatMoney(Number(refund.amount), invoice.currency)}
                              </td>
                              <td className="px-4 py-3 text-gray-500">
                                {refund.reason}
                              </td>
                              <td className="px-4 py-3">
                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                                  {tRefund(`status.${refund.status}`)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                {refund.status !== "VOID" && (
                                  <button
                                    type="button"
                                    onClick={() => setVoidRefundTarget(refund)}
                                    className="inline-flex h-7 items-center gap-1 rounded-lg border border-gray-200 px-2 text-xs font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
                                  >
                                    <Ban className="size-3.5" aria-hidden="true" />
                                    {tRefund("voidAction")}
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals / drawers */}
      {invoice && (
        <>
          <RecordPaymentDrawer
            open={recordPaymentOpen}
            onOpenChange={setRecordPaymentOpen}
            invoiceId={invoice.id}
            outstandingAmount={invoice.total_amount - invoice.paid_amount}
            currency={invoice.currency}
            onSuccess={() => setRecordPaymentOpen(false)}
          />

          <RefundDrawer
            open={!!refundTarget}
            onOpenChange={(open) => !open && setRefundTarget(null)}
            invoiceId={invoice.id}
            payment={refundTarget}
          />

          <ReceiptPrintModal
            open={!!printReceiptId}
            onOpenChange={(open) => !open && setPrintReceiptId(null)}
            receiptId={printReceiptId}
          />

          <ConfirmDialog
            open={!!voidPaymentTarget}
            onOpenChange={(open) => !open && setVoidPaymentTarget(null)}
            title={tPay("voidTitle")}
            description={tPay("voidDescription")}
            confirmLabel={tPay("voidAction")}
            isPending={voidPaymentMutation.isPending}
            onConfirm={() => {
              if (voidPaymentTarget)
                voidPaymentMutation.mutate(voidPaymentTarget.id, {
                  onSuccess: () => setVoidPaymentTarget(null),
                });
            }}
          />

          <ConfirmDialog
            open={!!voidRefundTarget}
            onOpenChange={(open) => !open && setVoidRefundTarget(null)}
            title={tRefund("voidTitle")}
            description={tRefund("voidDescription")}
            confirmLabel={tRefund("voidAction")}
            isPending={voidRefundMutation.isPending}
            onConfirm={() => {
              if (voidRefundTarget)
                voidRefundMutation.mutate(voidRefundTarget.id, {
                  onSuccess: () => setVoidRefundTarget(null),
                });
            }}
          />

          <VoidInvoiceDialog
            open={voidDialogOpen}
            onOpenChange={setVoidDialogOpen}
            invoiceId={invoice.id}
            onSuccess={() => setVoidDialogOpen(false)}
          />

          <InvoiceDrawer
            open={editDrawerOpen}
            onOpenChange={setEditDrawerOpen}
            invoiceId={invoice.id}
          />
        </>
      )}
    </div>
  );
}
