"use client";

import { Ban, Receipt, Undo2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatMoney, formatDateLong as formatDate, personName } from "../lib/format";
import type { Payment, Receipt as ReceiptRow } from "../types/financial.types";

type Props = {
  payments: Payment[];
  loading: boolean;
  /** payment_id → receipt, for the per-row "Receipt" action. */
  receiptByPayment: Map<string, ReceiptRow>;
  onPrintReceipt: (receiptId: string) => void;
  onRefund: (payment: Payment) => void;
  onVoidPayment: (payment: Payment) => void;
};

/** The payment-history card: skeleton / empty state / sorted payments table. */
export function InvoicePaymentsList({
  payments,
  loading,
  receiptByPayment,
  onPrintReceipt,
  onRefund,
  onVoidPayment,
}: Props) {
  const t = useTranslations("financial.invoice");
  const tPay = useTranslations("financial.payments");
  const tRefund = useTranslations("financial.refund");
  const tReceipt = useTranslations("financial.receipt");

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-gray-700">
        {t("view.paymentHistory")}
      </h2>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />
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
                      {personName(payment.recorded_by, payment.recorded_by_id)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {receiptByPayment.has(payment.id) && (
                          <button
                            type="button"
                            onClick={() =>
                              onPrintReceipt(receiptByPayment.get(payment.id)!.id)
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
                            onClick={() => onRefund(payment)}
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
                            onClick={() => onVoidPayment(payment)}
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
  );
}
