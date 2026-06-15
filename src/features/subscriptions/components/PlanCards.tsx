"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/common/utils/utils";
import { usePlans } from "../hooks/useSubscription";
import { formatMoney } from "../lib/format";
import { CreatePaymentDialog } from "./CreatePaymentDialog";
import type { Plan } from "../lib/subscriptions.types";

export function PlanCards({
  organizationId,
  currentPlanCode,
}: {
  organizationId: string | undefined;
  currentPlanCode: string | undefined;
}) {
  const t = useTranslations("subscriptions");
  const locale = useLocale();
  const { data, isLoading } = usePlans();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-400">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  // Free trial isn't purchasable — hide it from the picker.
  const plans = (data?.data ?? []).filter((p) => p.plan !== "free_trial");

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.plan === currentPlanCode;
          const yearly = plan.prices.find(
            (p) => p.billing_interval === "YEARLY",
          );
          return (
            <div
              key={plan.id}
              className={cn(
                "flex flex-col rounded-2xl border p-5",
                isCurrent
                  ? "border-brand-primary bg-brand-primary/5"
                  : "border-gray-100 bg-white",
              )}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium text-brand-black">
                  {t(`planNames.${plan.plan}`)}
                </h3>
                {isCurrent && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-primary/10 px-2.5 py-1 text-xs font-medium text-brand-primary">
                    <Check className="size-3" />
                    {t("plans.current")}
                  </span>
                )}
              </div>

              <p className="mt-3 text-2xl font-semibold text-brand-black">
                {yearly
                  ? formatMoney(yearly.price, yearly.currency, locale)
                  : "-"}
                <span className="text-sm font-normal text-gray-400">
                  {" "}
                  / {t("plans.perYear")}
                </span>
              </p>

              <ul className="mt-4 flex-1 space-y-2 text-sm text-gray-500">
                <li>{t("plans.limits.branches", { count: plan.max_branches })}</li>
                <li>{t("plans.limits.staff", { count: plan.max_staff })}</li>
                <li>
                  {t("plans.limits.organizations", {
                    count: plan.max_organizations,
                  })}
                </li>
              </ul>

              <Button
                type="button"
                className={cn(
                  "mt-5 w-full",
                  isCurrent
                    ? ""
                    : "bg-brand-primary text-white hover:bg-brand-primary/90",
                )}
                variant={isCurrent ? "outline" : "default"}
                onClick={() => setSelectedPlan(plan)}
              >
                {isCurrent ? t("plans.renew") : t("plans.upgrade")}
              </Button>
            </div>
          );
        })}
      </div>

      <CreatePaymentDialog
        mode="plan"
        organizationId={organizationId}
        plan={selectedPlan}
        open={selectedPlan !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedPlan(null);
        }}
      />
    </>
  );
}
