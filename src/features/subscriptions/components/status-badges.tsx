"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import type {
  PaymentStatus,
  SubscriptionStatus,
} from "../lib/subscriptions.types";

const SUBSCRIPTION_STYLES: Record<SubscriptionStatus, string> = {
  TRIAL: "bg-amber-50 text-amber-700",
  ACTIVE: "bg-emerald-50 text-emerald-700",
  EXPIRED: "bg-red-50 text-red-600",
  CANCELLED: "bg-gray-100 text-gray-500",
};

const PAYMENT_STYLES: Record<PaymentStatus, string> = {
  PENDING: "bg-gray-100 text-gray-500",
  AWAITING_VERIFICATION: "bg-amber-50 text-amber-700",
  VERIFIED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-600",
  CANCELLED: "bg-gray-100 text-gray-500",
};

const PILL = "rounded-full px-2.5 py-1 text-xs font-medium";

export function SubscriptionStatusBadge({
  status,
}: {
  status: SubscriptionStatus;
}) {
  const t = useTranslations("subscriptions");
  return (
    <span className={cn(PILL, SUBSCRIPTION_STYLES[status])}>
      {t(`status.${status}`)}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const t = useTranslations("subscriptions");
  return (
    <span className={cn(PILL, PAYMENT_STYLES[status])}>
      {t(`paymentStatus.${status}`)}
    </span>
  );
}
