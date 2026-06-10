"use client";

import { useMemo, useState } from "react";
import { Receipt, Undo2, Ban, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import { usePayments } from "../hooks/usePayments";
import { useReceipts } from "../hooks/useReceipts";
import { useVoidPayment } from "../hooks/useVoidPayment";
import { formatMoney } from "../lib/format";
import { RefundDrawer } from "./RefundDrawer";
import { ReceiptPrintModal } from "./ReceiptPrintModal";
import { ConfirmDialog } from "./ConfirmDialog";
import type { Payment } from "../types/financial.types";

type Props = {
  invoiceId: string;
  currency?: string | null;
};

/**
 * Payments list + per-payment actions (receipt / refund / void) for an invoice.
 * Self-contained — fetches its own data and hosts the refund/receipt/void
 * dialogs — so both the InvoiceDrawer view mode and InvoiceDetailPage can drop
 * it in without duplicating the wiring.
 */
export function InvoicePaymentsPanel({ invoiceId, currency }: Props) {
  const t = useTranslations("financial.invoice");
  const tPay = useTranslations("financial.payment");
  const { payments, isLoading } = usePayments(invoiceId);
  const { receipts } = useReceipts(invoiceId);
  const voidPaymentMutation = useVoidPayment(invoiceId);

  const [refundTarget, setRefundTarget] = useState<Payment | null>(null);
  const [printReceiptId, setPrintReceiptId] = useState<string | null>(null);
  const [voidTarget, setVoidTarget] = useState<Payment | null>(null);

  const receiptByPayment = useMemo(
    () => new Map(receipts.map((r) => [r.payment_id, r])),
    [receipts],
  );

  const sorted = useMemo(
    () =>
      [...payments].sort(
        (a, b) =>
          new Date(b.payment_date).getTime() -
          new Date(a.payment_date).getTime(),
      ),
    [payments],
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-4 py-2.5">
        <h3 className="text-sm font-semibold text-gray-700">
          {t("payments.title")}
        </h3>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-6 text-sm text-gray-400">
          <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
          {tPay("loading")}
        </div>
      ) : sorted.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-gray-400">
          {t("payments.none")}
        </p>
      ) : (
        <ul className="divide-y divide-gray-50">
          {sorted.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-3 px-4 py-2.5 text-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 tabular-nums">
                  {formatMoney(p.amount, p.currency ?? currency)}
                </p>
                <p className="text-[11px] text-gray-400">
                  {new Date(p.payment_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                  {" · "}
                  {tPay(`method.${p.payment_method}`)}
                  {p.reference_number ? ` · ${p.reference_number}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {receiptByPayment.has(p.id) && (
                  <ActionBtn
                    icon={<Receipt className="size-3.5" aria-hidden="true" />}
                    label={t("actions.printReceipt")}
                    onClick={() =>
                      setPrintReceiptId(receiptByPayment.get(p.id)!.id)
                    }
                  />
                )}
                {p.status === "COMPLETED" && (
                  <ActionBtn
                    icon={<Undo2 className="size-3.5" aria-hidden="true" />}
                    label={t("actions.refund")}
                    danger
                    onClick={() => setRefundTarget(p)}
                  />
                )}
                {(p.status === "COMPLETED" || p.status === "PENDING") && (
                  <ActionBtn
                    icon={<Ban className="size-3.5" aria-hidden="true" />}
                    label={tPay("voidAction")}
                    danger
                    onClick={() => setVoidTarget(p)}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <RefundDrawer
        open={!!refundTarget}
        onOpenChange={(open) => !open && setRefundTarget(null)}
        invoiceId={invoiceId}
        payment={refundTarget}
      />
      <ReceiptPrintModal
        open={!!printReceiptId}
        onOpenChange={(open) => !open && setPrintReceiptId(null)}
        receiptId={printReceiptId}
      />
      <ConfirmDialog
        open={!!voidTarget}
        onOpenChange={(open) => !open && setVoidTarget(null)}
        title={tPay("voidTitle")}
        description={tPay("voidDescription")}
        confirmLabel={tPay("voidAction")}
        onConfirm={() => {
          if (voidTarget)
            voidPaymentMutation.mutate(voidTarget.id, {
              onSuccess: () => setVoidTarget(null),
            });
        }}
      />
    </div>
  );
}

function ActionBtn({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors",
        danger
          ? "hover:bg-red-50 hover:text-red-600"
          : "hover:bg-gray-50 hover:text-gray-700",
      )}
    >
      {icon}
    </button>
  );
}
