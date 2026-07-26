"use client";

import { AlertTriangle, Infinity as InfinityIcon, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import { useSubscriptionUsage } from "../hooks/useSubscription";

function fmt(n: number, locale: string) {
  return new Intl.NumberFormat(locale).format(n);
}

/**
 * Live journey-metering meter for the current billing period. Reads
 * `GET .../subscription/usage`. Renders a consumed/allowance bar with
 * threshold colouring (70% amber, 90%/blocked red), the remaining balance, a
 * blocked warning, and a per-care-path breakdown. A contact-sales (hospital)
 * plan has a `null` allowance → shown as "Unlimited" with no bar.
 */
export function JourneyUsageMeter({
  organizationId,
}: {
  organizationId: string | undefined;
}) {
  const t = useTranslations("subscriptions");
  const locale = useLocale();
  const { data, isLoading, isError } = useSubscriptionUsage(organizationId);
  const usage = data?.data;

  if (isLoading) {
    return (
      <div className="mt-4 flex items-center justify-center rounded-xl border border-gray-100 py-6 text-gray-400">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  // A missing usage read shouldn't break the settings page — just hide the meter.
  if (isError || !usage) return null;

  const unlimited = usage.allowance === null;
  const percent = Math.min(100, Math.max(0, usage.percent));
  const barColor = usage.blocked || percent >= 90
    ? "bg-red-500"
    : percent >= 70
      ? "bg-amber-500"
      : "bg-emerald-500";

  const breakdown = Object.entries(usage.breakdown)
    .filter(([, units]) => units > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="mt-4 rounded-xl border border-gray-100 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-brand-black">
          {t("usage.title")}
        </h3>
        {unlimited ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-primary/10 px-2.5 py-1 text-xs font-medium text-brand-primary">
            <InfinityIcon className="size-3" />
            {t("usage.unlimited")}
          </span>
        ) : (
          <span className="text-sm font-semibold text-brand-black">
            {t("usage.used", {
              consumed: fmt(usage.consumed, locale),
              allowance: fmt(usage.allowance ?? 0, locale),
            })}
          </span>
        )}
      </div>

      {!unlimited && (
        <>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={cn("h-full rounded-full transition-all", barColor)}
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {t("usage.remaining", {
              count: fmt(Math.max(0, usage.remaining ?? 0), locale),
            })}
          </p>
        </>
      )}

      {usage.blocked && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          <span>{t("usage.blocked")}</span>
        </div>
      )}

      {breakdown.length > 0 && (
        <div className="mt-4">
          <h4 className="mb-2 text-xs font-medium text-gray-400">
            {t("usage.breakdownTitle")}
          </h4>
          <ul className="space-y-1.5">
            {breakdown.map(([code, units]) => {
              const key = `usage.carePaths.${code}`;
              return (
                <li
                  key={code}
                  className="flex items-center justify-between text-xs text-gray-600"
                >
                  <span>{t.has(key) ? t(key) : code}</span>
                  <span className="font-medium text-brand-black">
                    {fmt(units, locale)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
