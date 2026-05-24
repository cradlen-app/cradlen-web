import { useMemo } from "react";
import { cn } from "@/common/utils/utils";
import { formatMoney } from "../lib/format";

type TotalsItem = {
  unit_price: number;
  quantity: number;
  discount_amount?: number | null;
};

type Props = {
  items: TotalsItem[];
  /** ISO currency code (e.g. "EGP"). Falls back to "EGP" when unspecified. */
  currency?: string | null;
  className?: string;
};

export function InvoiceTotalsPanel({ items, currency, className }: Props) {
  const { subtotal, totalDiscount, total } = useMemo(() => {
    const sub = items.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0,
    );
    const disc = items.reduce(
      (sum, item) => sum + (item.discount_amount ?? 0),
      0,
    );
    return {
      subtotal: sub,
      totalDiscount: disc,
      total: sub - disc,
    };
  }, [items]);

  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-4 text-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between py-1.5">
        <span className="text-gray-500">Subtotal</span>
        <span className="font-medium text-gray-900">
          {formatMoney(subtotal, currency)}
        </span>
      </div>

      <div className="flex items-center justify-between py-1.5">
        <span className="text-gray-500">Discount</span>
        <span className="font-medium text-red-600">
          -{formatMoney(totalDiscount, currency)}
        </span>
      </div>

      <div className="my-2 border-t border-gray-200" />

      <div className="flex items-center justify-between py-1.5">
        <span className="font-semibold text-gray-900">Total</span>
        <span className="text-base font-semibold text-gray-900">
          {formatMoney(total, currency)}
        </span>
      </div>
    </div>
  );
}
