"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import { InvoicePricingSourceBadge } from "./InvoicePricingSourceBadge";
import { InvoiceTotalsPanel } from "./InvoiceTotalsPanel";
import { formatMoney } from "../lib/format";
import type { InvoiceItem } from "../types/financial.types";

type Props = {
  items: InvoiceItem[];
  currency: string;
  /** Compact, single-surface layout for the narrow master-detail panel. */
  dense?: boolean;
};

/** The line-items card: the items table plus the totals panel. */
export function InvoiceItemsTable({ items, currency, dense = false }: Props) {
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
        {t("view.lineItems")}
      </h2>
      <div className="min-w-0 overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
              <th className="px-4 py-2.5 text-left font-medium">
                {t("lineItems.description")}
              </th>
              <th className="px-4 py-2.5 text-center font-medium">
                {t("lineItems.qty")}
              </th>
              {!dense && (
                <>
                  <th className="px-4 py-2.5 text-right font-medium">
                    {t("lineItems.unitPrice")}
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium">
                    {t("lineItems.pricingSource")}
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium">
                    {t("lineItems.discount")}
                  </th>
                </>
              )}
              <th className="px-4 py-2.5 text-right font-medium">
                {t("lineItems.total")}
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className="border-b border-gray-50 last:border-0"
              >
                <td className="px-4 py-3 text-gray-900 break-words">
                  {item.description}
                </td>
                <td className="px-4 py-3 text-center text-gray-600">
                  {item.quantity}
                </td>
                {!dense && (
                  <>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {formatMoney(item.unit_price, currency)}
                    </td>
                    <td className="px-4 py-3">
                      <InvoicePricingSourceBadge source={item.pricing_source} />
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {item.discount_amount
                        ? formatMoney(item.discount_amount, currency)
                        : "—"}
                    </td>
                  </>
                )}
                <td className="px-4 py-3 text-right font-medium text-gray-900">
                  {formatMoney(item.total_amount, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end">
        <InvoiceTotalsPanel
          items={items}
          currency={currency}
          className={dense ? "w-full" : "w-72"}
        />
      </div>
    </div>
  );
}
