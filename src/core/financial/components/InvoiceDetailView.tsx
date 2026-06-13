"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useInvoiceDetail } from "../hooks/useInvoiceDetail";
import { InvoiceDetailHeader } from "./InvoiceDetailHeader";
import { InvoiceDetailsCard } from "./InvoiceDetailsCard";
import { InvoiceItemsTable } from "./InvoiceItemsTable";
import { InvoicePaymentsList } from "./InvoicePaymentsList";
import { InvoiceRefundsList } from "./InvoiceRefundsList";
import { RecordPaymentDrawer } from "./RecordPaymentDrawer";
import { RefundDrawer } from "./RefundDrawer";
import { ReceiptPrintModal } from "./ReceiptPrintModal";
import { ConfirmDialog } from "./ConfirmDialog";
import { VoidInvoiceDialog } from "./VoidInvoiceDialog";
import { InvoiceDrawer } from "./InvoiceDrawer";
import type { Payment, Refund } from "../types/financial.types";

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
  /**
   * On wide screens the panel sits in a narrow column, so the metadata + line
   * items stack instead of going side-by-side. Defaults to the roomy two-column
   * layout used by the standalone detail page.
   */
  layout?: "page" | "panel";
};

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * The full invoice detail body — header, metadata, line items, payments and
 * refunds, plus every action drawer/dialog. Driven entirely by
 * `useInvoiceDetail(invoiceId)`, so it can be mounted as a standalone page, an
 * inline master-detail panel, or inside a mobile drawer.
 */
export function InvoiceDetailView({ invoiceId, layout = "page" }: Props) {
  const t = useTranslations("financial.invoice");

  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [refundTarget, setRefundTarget] = useState<Payment | null>(null);
  const [printReceiptId, setPrintReceiptId] = useState<string | null>(null);
  const [voidPaymentTarget, setVoidPaymentTarget] = useState<Payment | null>(null);
  const [voidRefundTarget, setVoidRefundTarget] = useState<Refund | null>(null);

  const tPay = useTranslations("financial.payments");
  const tRefund = useTranslations("financial.refund");

  const {
    invoice,
    isLoading,
    payments,
    paymentsLoading,
    refunds,
    receiptByPayment,
    permissions,
    issueMutation,
    voidPaymentMutation,
    voidRefundMutation,
  } = useInvoiceDetail(invoiceId);

  if (isLoading) return <DetailSkeleton />;

  if (!invoice) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-500">
        {t("view.notFound")}
      </div>
    );
  }

  // In the narrow master-detail panel the sub-sections render dense (compact
  // padding, single-surface, no fixed widths) so nothing clips or overflows.
  const dense = layout === "panel";
  const bodyGrid = dense ? "grid gap-4" : "grid gap-6 lg:grid-cols-[320px_1fr]";

  return (
    <>
      <div className={dense ? "min-w-0 space-y-4" : "space-y-6"}>
        <InvoiceDetailHeader
          invoice={invoice}
          permissions={permissions}
          issuing={issueMutation.isPending}
          dense={dense}
          onVoid={() => setVoidDialogOpen(true)}
          onEdit={() => setEditDrawerOpen(true)}
          onIssue={() => issueMutation.mutate(invoice.id)}
          onRecordPayment={() => setRecordPaymentOpen(true)}
        />

        <div className={bodyGrid}>
          <InvoiceDetailsCard invoice={invoice} dense={dense} />

          <div className={dense ? "min-w-0 space-y-4" : "space-y-6"}>
            <InvoiceItemsTable
              items={invoice.items}
              currency={invoice.currency}
              dense={dense}
            />

            <InvoicePaymentsList
              payments={payments}
              loading={paymentsLoading}
              receiptByPayment={receiptByPayment}
              dense={dense}
              onPrintReceipt={setPrintReceiptId}
              onRefund={setRefundTarget}
              onVoidPayment={setVoidPaymentTarget}
            />

            <InvoiceRefundsList
              refunds={refunds}
              currency={invoice.currency}
              dense={dense}
              onVoidRefund={setVoidRefundTarget}
            />
          </div>
        </div>
      </div>

      {/* Modals / drawers */}
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
  );
}
