"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import { formatMoney } from "../lib/format";
import { computeInvoiceTotals, type TotalsItem } from "../lib/totals";
import type { DiscountType, Invoice } from "../types/financial.types";

type Props = {
  items: TotalsItem[];
  /** ISO currency code (e.g. "EGP"). Falls back to "EGP" when unspecified. */
  currency?: string | null;
  /** Invoice-level discount being edited (live preview). */
  discountType?: DiscountType | "NONE";
  discountValue?: number;
  /**
   * Server snapshot of the saved invoice. When present, tax / paid / balance
   * come from the backend (authoritative) and the Paid + Balance rows show.
   */
  invoice?: Invoice | null;
  className?: string;
};

export function InvoiceTotalsPanel({
  items,
  currency,
  discountType = "NONE",
  discountValue = 0,
  invoice,
  className,
}: Props) {
  const t = useTranslations("financial.invoice.totals");

  const calc = useMemo(
    () =>
      computeInvoiceTotals(items, discountType, discountValue, {
        tax: invoice?.tax_amount,
        paid: invoice?.paid_amount,
        balance: invoice?.balance_due,
      }),
    [items, discountType, discountValue, invoice],
  );

  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-4 text-sm",
        className,
      )}
    >
      <Row label={t("subtotal")} value={formatMoney(calc.subtotal, currency)} />

      {calc.lineDiscounts > 0 && (
        <Row
          label={t("lineDiscounts")}
          value={`-${formatMoney(calc.lineDiscounts, currency)}`}
          valueClass="text-red-600"
        />
      )}

      {calc.invoiceDiscount > 0 && (
        <Row
          label={t("invoiceDiscount")}
          value={`-${formatMoney(calc.invoiceDiscount, currency)}`}
          valueClass="text-red-600"
        />
      )}

      {calc.tax > 0 && (
        <Row label={t("tax")} value={formatMoney(calc.tax, currency)} />
      )}

      <div className="my-2 border-t border-gray-200" />

      <div className="flex items-center justify-between py-1.5">
        <span className="font-semibold text-gray-900">{t("total")}</span>
        <span className="text-base font-semibold text-gray-900">
          {formatMoney(calc.total, currency)}
        </span>
      </div>

      {invoice && (
        <>
          <Row
            label={t("paid")}
            value={formatMoney(calc.paid, currency)}
            valueClass="text-emerald-600"
          />
          <div className="flex items-center justify-between py-1.5">
            <span className="font-semibold text-gray-900">
              {t("balanceDue")}
            </span>
            <span
              className={cn(
                "text-base font-semibold",
                calc.balance > 0 ? "text-amber-600" : "text-emerald-600",
              )}
            >
              {formatMoney(calc.balance, currency)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-gray-500">{label}</span>
      <span className={cn("font-medium text-gray-900", valueClass)}>
        {value}
      </span>
    </div>
  );
}
