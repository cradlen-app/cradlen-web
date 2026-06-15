"use client";

import { ArrowLeft, ChevronRight, Loader2, Receipt } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { getActiveProfile } from "@/features/auth/lib/current-user";
import { Link } from "@/i18n/navigation";
import { useDashboardPath } from "@/hooks/useDashboardPath";
import { EmptyState } from "@/features/settings/components/settings-ui";
import { usePayments } from "../hooks/useSubscription";
import { formatDate, formatMoney } from "../lib/format";
import { PaymentStatusBadge } from "./status-badges";

export function PaymentsListPage() {
  const t = useTranslations("subscriptions");
  const locale = useLocale();
  const dashboardPath = useDashboardPath();
  const { data: user } = useCurrentUser();
  const organizationId = getActiveProfile(user)?.organization.id;

  const { data, isLoading, isError } = usePayments(organizationId);
  const payments = data?.data ?? [];
  const settingsHref = dashboardPath("/settings");

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col gap-4 overflow-y-auto p-4 lg:p-6">
      <Link
        href={settingsHref as Parameters<typeof Link>[0]["href"]}
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-brand-black"
      >
        <ArrowLeft className="size-4" />
        {t("payments.back")}
      </Link>

      <header className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm shadow-gray-100/60">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary/8 text-brand-primary">
            <Receipt className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-medium text-brand-black">
              {t("payments.title")}
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              {t("payments.description")}
            </p>
          </div>
        </div>
      </header>

      <div className="rounded-2xl border border-gray-100 bg-white p-2 shadow-sm shadow-gray-100/60">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : isError ? (
          <p className="py-12 text-center text-sm text-red-500">
            {t("payments.loadError")}
          </p>
        ) : payments.length === 0 ? (
          <div className="p-2">
            <EmptyState
              title={t("payments.empty")}
              description={t("payments.emptyDesc")}
            />
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {payments.map((payment) => (
              <li key={payment.id}>
                <Link
                  href={
                    dashboardPath(
                      `/settings/subscription/payments/${payment.id}`,
                    ) as Parameters<typeof Link>[0]["href"]
                  }
                  className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-brand-black">
                      {formatMoney(payment.amount, payment.currency, locale)}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {t(`purpose.${payment.purpose}`)} ·{" "}
                      {t(`createDialog.providers.${payment.provider}`)} ·{" "}
                      {formatDate(payment.created_at, locale)}
                    </p>
                  </div>
                  <PaymentStatusBadge status={payment.status} />
                  <ChevronRight className="size-4 shrink-0 text-gray-300" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
