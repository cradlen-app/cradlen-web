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
  ExternalLink,
  FileText,
} from "lucide-react";
import { cn } from "@/common/utils/utils";
import { Button } from "@/components/ui/button";
import { useInvoice } from "../hooks/useInvoice";
import { usePayments } from "../hooks/usePayments";
import { useIssueInvoice } from "../hooks/useIssueInvoice";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { InvoicePricingSourceBadge } from "./InvoicePricingSourceBadge";
import { InvoiceTotalsPanel } from "./InvoiceTotalsPanel";
import { RecordPaymentDrawer } from "./RecordPaymentDrawer";
import { VoidInvoiceDialog } from "./VoidInvoiceDialog";
import { InvoiceDrawer } from "./InvoiceDrawer";
import type { Payment } from "../types/financial.types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatAmount(value: number): string {
  return `EGP ${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

const PAYMENT_METHOD_LABELS: Record<Payment["method"], string> = {
  CASH: "Cash",
  CARD: "Card",
  BANK_TRANSFER: "Bank Transfer",
  INSURANCE: "Insurance",
  OTHER: "Other",
};

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
  const params = useParams<{ locale: string; orgId: string; branchId: string }>();
  const locale = params?.locale ?? "";
  const orgId = params?.orgId ?? "";
  const branchId = params?.branchId ?? "";

  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);

  const { invoice, isLoading } = useInvoice(invoiceId);
  const { payments, isLoading: paymentsLoading } = usePayments(invoiceId);
  const issueMutation = useIssueInvoice();

  // Status-based permissions (mirroring InvoiceDrawer view mode)
  const canEdit = invoice?.status === "DRAFT";
  const canIssue = invoice?.status === "DRAFT";
  const canRecordPayment =
    invoice?.status === "ISSUED" || invoice?.status === "PARTIALLY_PAID";
  const canVoid = invoice?.status === "DRAFT";
  const isPartiallyPaid = invoice?.status === "PARTIALLY_PAID";

  // Base dashboard path
  const dashboardBase = `/${locale}/${orgId}/${branchId}/dashboard`;
  const visitsHref = `${dashboardBase}/visits`;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-full bg-gray-50/50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-gray-500">
          <Link
            href={visitsHref}
            className="transition-colors hover:text-gray-900"
          >
            Billing
          </Link>
          <ChevronRight className="size-4 shrink-0 text-gray-400" aria-hidden="true" />
          <span className="font-medium text-gray-900">
            {invoice ? `INV-${invoice.invoice_number}` : "Loading…"}
          </span>
        </nav>

        {/* Loading state */}
        {isLoading && <DetailSkeleton />}

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
                        INV-{invoice.invoice_number}
                      </h1>
                    </div>
                    <InvoiceStatusBadge status={invoice.status} />
                  </div>
                  <p className="text-sm text-gray-500">
                    Created on {formatDate(invoice.created_at)}
                  </p>
                  {/* Remaining balance */}
                  {invoice.amount_due > 0 && (
                    <p
                      className={cn(
                        "text-sm font-medium",
                        isPartiallyPaid ? "text-amber-600" : "text-gray-600",
                      )}
                    >
                      Balance due: {formatAmount(invoice.amount_due)}
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
                      Void
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
                      Edit
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
                      Issue Invoice
                    </Button>
                  )}
                  {canRecordPayment && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setRecordPaymentOpen(true)}
                    >
                      <CreditCard className="size-3.5" aria-hidden="true" />
                      Record Payment
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
                  Invoice Details
                </h2>
                <dl className="space-y-3 text-sm">
                  {/* Patient */}
                  {invoice.patient_id && (
                    <div className="flex items-start justify-between gap-2">
                      <dt className="shrink-0 text-gray-500">Patient</dt>
                      <dd className="text-right font-medium text-gray-900">
                        <span className="block">{invoice.patient_id}</span>
                      </dd>
                    </div>
                  )}

                  {/* Visit link */}
                  {invoice.visit_id && (
                    <div className="flex items-start justify-between gap-2">
                      <dt className="shrink-0 text-gray-500">Visit</dt>
                      <dd className="text-right">
                        <Link
                          href={`${dashboardBase}/visits/${invoice.visit_id}`}
                          className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          View Visit
                          <ExternalLink className="size-3.5" aria-hidden="true" />
                        </Link>
                      </dd>
                    </div>
                  )}

                  {/* Invoice type */}
                  <div className="flex items-start justify-between gap-2">
                    <dt className="shrink-0 text-gray-500">Type</dt>
                    <dd className="text-right font-medium text-gray-900 capitalize">
                      {invoice.invoice_type.toLowerCase().replace(/_/g, " ")}
                    </dd>
                  </div>

                  {/* Issue date */}
                  {invoice.issued_at && (
                    <div className="flex items-start justify-between gap-2">
                      <dt className="shrink-0 text-gray-500">Issued</dt>
                      <dd className="text-right font-medium text-gray-900">
                        {formatDate(invoice.issued_at)}
                      </dd>
                    </div>
                  )}

                  {/* Due date */}
                  {invoice.due_date && (
                    <div className="flex items-start justify-between gap-2">
                      <dt className="shrink-0 text-gray-500">Due Date</dt>
                      <dd className="text-right font-medium text-gray-900">
                        {formatDate(invoice.due_date)}
                      </dd>
                    </div>
                  )}

                  {/* Notes */}
                  {invoice.notes && (
                    <div className="border-t border-gray-100 pt-3">
                      <dt className="mb-1 text-gray-500">Notes</dt>
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
                    Line Items
                  </h2>
                  <div className="overflow-x-auto rounded-xl border border-gray-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
                          <th className="px-4 py-2.5 text-left font-medium">
                            Description
                          </th>
                          <th className="px-4 py-2.5 text-center font-medium">
                            Qty
                          </th>
                          <th className="px-4 py-2.5 text-right font-medium">
                            Unit Price
                          </th>
                          <th className="px-4 py-2.5 text-left font-medium">
                            Pricing Source
                          </th>
                          <th className="px-4 py-2.5 text-right font-medium">
                            Discount
                          </th>
                          <th className="px-4 py-2.5 text-right font-medium">
                            Total
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
                              {item.service_name}
                            </td>
                            <td className="px-4 py-3 text-center text-gray-600">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-600">
                              {formatAmount(item.unit_price)}
                            </td>
                            <td className="px-4 py-3">
                              <InvoicePricingSourceBadge
                                source={item.pricing_source}
                              />
                            </td>
                            <td className="px-4 py-3 text-right text-gray-600">
                              {item.discount
                                ? formatAmount(item.discount)
                                : "—"}
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-gray-900">
                              {formatAmount(item.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals */}
                  <div className="mt-4 flex justify-end">
                    <InvoiceTotalsPanel items={invoice.items} className="w-72" />
                  </div>
                </div>

                {/* Payment history table */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h2 className="mb-4 text-sm font-semibold text-gray-700">
                    Payment History
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
                      No payments recorded yet
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
                            <th className="px-4 py-2.5 text-left font-medium">
                              Date
                            </th>
                            <th className="px-4 py-2.5 text-right font-medium">
                              Amount
                            </th>
                            <th className="px-4 py-2.5 text-left font-medium">
                              Method
                            </th>
                            <th className="px-4 py-2.5 text-left font-medium">
                              Reference
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...payments]
                            .sort(
                              (a, b) =>
                                new Date(b.paid_at).getTime() -
                                new Date(a.paid_at).getTime(),
                            )
                            .map((payment) => (
                              <tr
                                key={payment.id}
                                className="border-b border-gray-50 last:border-0"
                              >
                                <td className="px-4 py-3 text-gray-600">
                                  {formatDate(payment.paid_at)}
                                </td>
                                <td className="px-4 py-3 text-right font-medium text-gray-900">
                                  {formatAmount(payment.amount)}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                  {PAYMENT_METHOD_LABELS[payment.method]}
                                </td>
                                <td className="px-4 py-3 text-gray-500">
                                  {payment.reference ?? "—"}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
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
            outstandingAmount={invoice.amount_due}
            onSuccess={() => setRecordPaymentOpen(false)}
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
