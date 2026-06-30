"use client";

import type { useTranslations } from "next-intl";
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";
import { usePushSubscription } from "@/features/notifications/hooks/usePushSubscription";
import { cn } from "@/common/utils/utils";

/**
 * Settings → Notifications. The single, explicit opt-in for browser push. Reads
 * the live subscription state from the browser and drives subscribe/unsubscribe
 * through `usePushSubscription`. `t` is the "settings" namespace; copy lives
 * under `settings.notifications.*`.
 */
export function NotificationsSection({
  t,
}: {
  t: ReturnType<typeof useTranslations>;
}) {
  const { status, busy, enable, disable } = usePushSubscription();

  const Icon =
    status === "subscribed" ? BellRing : status === "denied" ? BellOff : Bell;

  const hint =
    status === "subscribed"
      ? t("notifications.enabledHint")
      : status === "denied"
        ? t("notifications.blockedHint")
        : status === "unsupported"
          ? t("notifications.unsupportedHint")
          : t("notifications.description");

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm shadow-gray-100/60 lg:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-full",
              status === "subscribed"
                ? "bg-brand-primary/10 text-brand-primary"
                : status === "denied"
                  ? "bg-amber-50 text-amber-600"
                  : "bg-gray-100 text-gray-500",
            )}
          >
            <Icon className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-medium text-brand-black">
              {status === "subscribed"
                ? t("notifications.enabled")
                : status === "denied"
                  ? t("notifications.blocked")
                  : status === "unsupported"
                    ? t("notifications.unsupported")
                    : t("notifications.title")}
            </h2>
            <p className="mt-1 max-w-md text-sm text-gray-400">{hint}</p>
          </div>
        </div>

        {status !== "unsupported" && status !== "denied" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => (status === "subscribed" ? disable() : enable())}
            className={cn(
              "inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition disabled:opacity-60",
              status === "subscribed"
                ? "border border-gray-200 text-brand-black hover:bg-gray-50"
                : "bg-brand-primary text-white hover:opacity-90",
            )}
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {status === "subscribed"
              ? busy
                ? t("notifications.disabling")
                : t("notifications.disable")
              : busy
                ? t("notifications.enabling")
                : t("notifications.enable")}
          </button>
        )}
      </div>
    </section>
  );
}
