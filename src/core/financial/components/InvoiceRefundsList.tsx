"use client";

import { Ban } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import { formatMoney, formatDateLong as formatDate } from "../lib/format";
import type { Refund } from "../types/financial.types";

type Props = {
  refunds: Refund[];
  currency: string;
  /** Compact, single-surface layout for the narrow master-detail panel. */
  dense?: boolean;
  onVoidRefund: (refund: Refund) => void;
};

/** The refunds card. Renders nothing when there are no refunds. */
export function InvoiceRefundsList({
  refunds,
  currency,
  dense = false,
  onVoidRefund,
}: Props) {
  const t = useTranslations("financial.invoice");
  const tRefund = useTranslations("financial.refund");

  if (refunds.length === 0) return null;

  return (
    <div
      className={cn(
        dense
          ? "min-w-0 border-t border-gray-100 pt-4"
          : "rounded-2xl border border-gray-200 bg-white p-5 shadow-sm",
      )}
    >
      <h2 className="mb-4 text-sm font-semibold text-gray-700">
        {tRefund("header")}
      </h2>
      <div className="min-w-0 overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
              <th className="px-4 py-2.5 text-left font-medium">
                {t("payments.date")}
              </th>
              <th className="px-4 py-2.5 text-right font-medium">
                {tRefund("amount")}
              </th>
              {!dense && (
                <th className="px-4 py-2.5 text-left font-medium">
                  {tRefund("reasonLabel")}
                </th>
              )}
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
                  {formatMoney(Number(refund.amount), currency)}
                </td>
                {!dense && (
                  <td className="px-4 py-3 text-gray-500">{refund.reason}</td>
                )}
                <td className="px-4 py-3">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {tRefund(`status.${refund.status}`)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {refund.status !== "VOID" && (
                    <button
                      type="button"
                      onClick={() => onVoidRefund(refund)}
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
  );
}
