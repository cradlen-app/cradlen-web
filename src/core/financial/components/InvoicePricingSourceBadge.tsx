"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import type { PricingSource } from "../types/financial.types";

const SOURCE_STYLES: Record<PricingSource, string> = {
  PROVIDER_OVERRIDE: "bg-purple-50 text-purple-700",
  BRANCH_OVERRIDE: "bg-blue-50 text-blue-700",
  ORG_PRICE_LIST: "bg-gray-100 text-gray-600",
  CUSTOM: "bg-amber-50 text-amber-700",
};

type Props = {
  source: PricingSource;
  className?: string;
};

export function InvoicePricingSourceBadge({ source, className }: Props) {
  const t = useTranslations("financial.invoice.pricingSource");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        SOURCE_STYLES[source],
        className,
      )}
    >
      {t(source)}
    </span>
  );
}
