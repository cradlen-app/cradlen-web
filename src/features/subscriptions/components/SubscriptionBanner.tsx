"use client";

import { AlertTriangle, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { getActiveProfile } from "@/features/auth/lib/current-user";
import { isOwner as isOwnerPerm } from "@/features/auth/lib/permissions";
import { Link } from "@/i18n/navigation";
import { useDashboardPath } from "@/hooks/useDashboardPath";
import { cn } from "@/common/utils/utils";
import { useCurrentSubscription } from "../hooks/useSubscription";

const TRIAL_WARN_DAYS = 7;

export function SubscriptionBanner() {
  const t = useTranslations("subscriptions");
  const dashboardPath = useDashboardPath();
  const { data: user } = useCurrentUser();
  const profile = getActiveProfile(user);
  const organizationId = profile?.organization.id;
  const isOwner = isOwnerPerm(profile);

  const { data } = useCurrentSubscription(organizationId);
  const sub = data?.data;
  if (!sub) return null;

  const blocked = sub.status === "EXPIRED" || sub.status === "CANCELLED";
  const trialEndsSoon =
    sub.status === "TRIAL" &&
    !!sub.trial_ends_at &&
    daysUntil(sub.trial_ends_at) <= TRIAL_WARN_DAYS;

  if (!blocked && !trialEndsSoon) return null;

  const renewHref = dashboardPath("/settings?section=subscription");

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm",
        blocked
          ? "bg-red-50 text-red-700"
          : "bg-amber-50 text-amber-800",
      )}
      role="status"
    >
      <span className="flex items-center gap-2">
        {blocked ? (
          <AlertTriangle className="size-4 shrink-0" />
        ) : (
          <Clock className="size-4 shrink-0" />
        )}
        {blocked
          ? t("banner.expired")
          : t("banner.trialEnding", {
              days: daysUntil(sub.trial_ends_at as string),
            })}
      </span>
      {isOwner ? (
        <Link
          href={renewHref as Parameters<typeof Link>[0]["href"]}
          className={cn(
            "shrink-0 rounded-full px-3 py-1 text-xs font-semibold text-white",
            blocked
              ? "bg-red-600 hover:bg-red-700"
              : "bg-amber-600 hover:bg-amber-700",
          )}
        >
          {t("banner.renew")}
        </Link>
      ) : (
        <span className="shrink-0 text-xs">{t("banner.contactAdmin")}</span>
      )}
    </div>
  );
}

function daysUntil(iso: string): number {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}
