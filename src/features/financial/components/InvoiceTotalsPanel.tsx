import { useMemo } from "react";
import { cn } from "@/common/utils/utils";

type TotalsItem = {
  unit_price: number;
  quantity: number;
  discount_amount?: number | null;
};

type Props = {
  items: TotalsItem[];
  className?: string;
};

function formatAmount(value: number) {
  return `EGP ${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

export function InvoiceTotalsPanel({ items, className }: Props) {
  const { subtotal, totalDiscount, total } = useMemo(() => {
    const subtotal = items.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0,
    );
    const totalDiscount = items.reduce(
      (sum, item) => sum + (item.discount_amount ?? 0),
      0,
    );
    return {
      subtotal,
      totalDiscount,
      total: subtotal - totalDiscount,
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
        <span className="font-medium text-gray-900">{formatAmount(subtotal)}</span>
      </div>

      <div className="flex items-center justify-between py-1.5">
        <span className="text-gray-500">Discount</span>
        <span className="font-medium text-red-600">-{formatAmount(totalDiscount)}</span>
      </div>

      <div className="my-2 border-t border-gray-200" />

      <div className="flex items-center justify-between py-1.5">
        <span className="font-semibold text-gray-900">Total</span>
        <span className="text-base font-semibold text-gray-900">{formatAmount(total)}</span>
      </div>
    </div>
  );
}
