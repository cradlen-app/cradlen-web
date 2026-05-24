"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import type { InvoiceStatus } from "../types/financial.types";

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  ISSUED: "bg-blue-50 text-blue-700",
  PARTIALLY_PAID: "bg-amber-50 text-amber-700",
  PAID: "bg-emerald-50 text-emerald-700",
  VOID: "bg-red-50 text-red-600",
  REFUNDED: "bg-purple-50 text-purple-700",
};

type Props = {
  status: InvoiceStatus;
  className?: string;
};

export function InvoiceStatusBadge({ status, className }: Props) {
  const t = useTranslations("financial.invoice.status");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        STATUS_STYLES[status],
        className,
      )}
    >
      {t(status)}
    </span>
  );
}
