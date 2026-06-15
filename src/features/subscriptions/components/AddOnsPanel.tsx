"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useAddOns } from "../hooks/useSubscription";
import { formatMoney } from "../lib/format";
import { CreatePaymentDialog } from "./CreatePaymentDialog";
import type { AvailableAddOn } from "../lib/subscriptions.types";

export function AddOnsPanel({
  organizationId,
  currentPlanCode,
  isActive,
}: {
  organizationId: string | undefined;
  currentPlanCode: string;
  isActive: boolean;
}) {
  const t = useTranslations("subscriptions");
  const locale = useLocale();
  const { data, isLoading } = useAddOns(isActive ? organizationId : undefined);
  const [selected, setSelected] = useState<AvailableAddOn | null>(null);

  const addOns = data?.data ?? [];

  return (
    <section className="mt-6">
      <h3 className="mb-1 text-sm font-medium text-brand-black">
        {t("addOns.title")}
      </h3>
      <p className="mb-3 text-xs text-gray-400">{t("addOns.description")}</p>

      {!isActive ? (
        <p className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-400">
          {t("addOns.requiresActive")}
        </p>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-6 text-gray-400">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : addOns.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-400">
          {t("addOns.empty")}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {addOns.map((addOn) => (
            <div
              key={addOn.id}
              className="flex flex-col rounded-xl border border-gray-100 bg-white p-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-brand-black">
                  {t(`addOns.kinds.${addOn.kind}`)}
                </h4>
                <span className="text-sm font-semibold text-brand-black">
                  {t("addOns.perYearFull", {
                    amount: formatMoney(addOn.price, addOn.currency, locale),
                  })}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {addOn.kind === "BRANCH_BUNDLE"
                  ? t("addOns.grants.branchesAndUsers", {
                      branches: addOn.delta_branches,
                      users: addOn.delta_users,
                    })
                  : t("addOns.grants.usersOnly", { users: addOn.delta_users })}
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-3 w-full"
                onClick={() => setSelected(addOn)}
              >
                <Plus className="size-4" />
                {t("addOns.buy")}
              </Button>
            </div>
          ))}
        </div>
      )}

      <CreatePaymentDialog
        mode="addon"
        organizationId={organizationId}
        addOn={selected}
        currentPlanCode={currentPlanCode}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </section>
  );
}
