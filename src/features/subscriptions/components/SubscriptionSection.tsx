"use client";

import { CreditCard, Loader2, Receipt } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { getActiveProfile } from "@/features/auth/lib/current-user";
import { Link } from "@/i18n/navigation";
import { useDashboardPath } from "@/hooks/useDashboardPath";
import {
  DetailRow,
  EmptyState,
  EntitySummary,
  SectionPanel,
} from "@/features/settings/components/settings-ui";
import { useCurrentSubscription } from "../hooks/useSubscription";
import { formatDate } from "../lib/format";
import { PlanCards } from "./PlanCards";
import { SubscriptionStatusBadge } from "./status-badges";

export function SubscriptionSection() {
  const t = useTranslations("subscriptions");
  const locale = useLocale();
  const dashboardPath = useDashboardPath();
  const { data: user } = useCurrentUser();
  const profile = getActiveProfile(user);
  const organizationId = profile?.organization.id;

  const { data, isLoading, isError } = useCurrentSubscription(organizationId);
  const sub = data?.data;

  return (
    <SectionPanel
      action={
        <Link
          href={
            dashboardPath(
              "/settings/subscription/payments",
            ) as Parameters<typeof Link>[0]["href"]
          }
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-brand-black hover:bg-gray-50"
        >
          <Receipt className="size-4" />
          {t("viewPayments")}
        </Link>
      }
      description={t("description")}
      icon={<CreditCard className="size-5" />}
      title={t("title")}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-gray-400">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : isError || !sub ? (
        <EmptyState title={t("loadError")} description={t("loadErrorDesc")} />
      ) : (
        <>
          <EntitySummary
            icon={<CreditCard className="size-5" />}
            label={t("currentPlan")}
            meta={<SubscriptionStatusBadge status={sub.status} />}
            title={sub.plan.plan}
          />
          <dl className="rounded-xl border border-gray-100 px-3">
            <DetailRow
              label={t("fields.status")}
              value={t(`status.${sub.status}`)}
            />
            {sub.status === "TRIAL" ? (
              <DetailRow
                label={t("fields.trialEnds")}
                value={formatDate(sub.trial_ends_at, locale)}
              />
            ) : (
              <DetailRow
                label={t("fields.renews")}
                value={formatDate(sub.ends_at, locale)}
              />
            )}
            <DetailRow
              label={t("fields.limits")}
              value={t("plans.limitsInline", {
                branches: sub.plan.max_branches,
                staff: sub.plan.max_staff,
              })}
            />
          </dl>

          <h3 className="mb-3 mt-6 text-sm font-medium text-brand-black">
            {t("plans.title")}
          </h3>
          <PlanCards
            organizationId={organizationId}
            currentPlanCode={sub.plan.plan}
          />
        </>
      )}
    </SectionPanel>
  );
}
