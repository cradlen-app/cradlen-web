"use client";

import { Dialog } from "radix-ui";
import { Building2, Gauge, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/infrastructure/http/api";
import { useRouter } from "@/i18n/navigation";
import { useDashboardPath } from "@/hooks/useDashboardPath";
import type { PlanChangeOverLimit } from "@/common/errors/subscription-errors";
import { useCreatePayment } from "../hooks/useSubscription";
import { saveInstructions } from "../lib/instructions-store";
import type { PaymentProvider, Plan } from "../lib/subscriptions.types";

type PlanLimitDrawerProps = {
  organizationId: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The plan the owner tried to buy but doesn't currently fit. */
  plan: Plan | null;
  provider: PaymentProvider;
  info: PlanChangeOverLimit | null;
};

/**
 * Opens when a plan purchase is blocked because the org is over the target
 * plan's limits (403 PLAN_CHANGE_OVER_LIMIT) on branches and/or already-consumed
 * journey units. Neither can be reduced inline — branches are destructive, and
 * journey units already spent this period are historical. So the only two
 * resolutions are: keep everything by buying the suggested add-ons (branch
 * bundles + journey packs) together with the plan in one combined payment, or
 * pick a larger plan.
 */
export function PlanLimitDrawer({
  organizationId,
  open,
  onOpenChange,
  plan,
  provider,
  info,
}: PlanLimitDrawerProps) {
  const t = useTranslations("subscriptions");
  const router = useRouter();
  const dashboardPath = useDashboardPath();

  const create = useCreatePayment(organizationId);

  const branchOver = info?.over.find((o) => o.resource === "branches");
  const unitsOver = info?.over.find((o) => o.resource === "units");
  const suggested = info?.suggested_add_ons ?? [];
  const branchSuggestion = suggested.find((s) => s.resource === "branches");
  const unitsSuggestion = suggested.find((s) => s.resource === "units");

  const addParts: string[] = [];
  if (branchSuggestion) {
    addParts.push(
      t("planLimit.addBranches", { count: branchSuggestion.quantity }),
    );
  }
  if (unitsSuggestion) {
    addParts.push(t("planLimit.addUnits", { count: unitsSuggestion.quantity }));
  }
  const keepLabel = addParts.length
    ? `${t("planLimit.keepEverything")} (${addParts.join(", ")})`
    : t("planLimit.keepEverything");

  function onSuccess(res: Awaited<ReturnType<typeof create.mutateAsync>>) {
    if (res.data.instructions) {
      saveInstructions(res.data.payment.id, res.data.instructions);
    }
    onOpenChange(false);
    router.push(
      dashboardPath(
        `/settings/subscription/payments/${res.data.payment.id}`,
      ) as Parameters<typeof router.push>[0],
    );
  }

  function onError(error: unknown) {
    toast.error(
      error instanceof ApiError
        ? (error.messages[0] ?? t("createDialog.error"))
        : t("createDialog.error"),
    );
  }

  /** Buy the whole suggested add-on set (branch bundles + journey packs). */
  function keepEverything() {
    if (!plan || suggested.length === 0) return;
    create.mutate(
      {
        plan: plan.plan,
        provider,
        add_ons: suggested.map((s) => ({ code: s.code, quantity: s.quantity })),
      },
      { onSuccess, onError },
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/35" />
        <Dialog.Content className="fixed end-0 top-0 z-51 flex h-full w-full max-w-md flex-col bg-white shadow-2xl outline-none">
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5">
            <div className="min-w-0">
              <Dialog.Title className="text-lg font-medium text-brand-black">
                {t("planLimit.title", {
                  plan: plan ? t(`planNames.${plan.plan}`) : "",
                })}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-gray-400">
                {t("planLimit.overview")}
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-50 hover:text-brand-black">
              <X className="size-5" />
            </Dialog.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {/* Per-resource overage summary (server-authoritative counts). */}
            <ul className="space-y-2">
              {info?.over.map((o) => (
                <li
                  key={o.resource}
                  className="flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700"
                >
                  <span>{t(`planLimit.resource.${o.resource}`)}</span>
                  <span className="tabular-nums">
                    {o.current} / {o.limit}
                  </span>
                </li>
              ))}
            </ul>

            {branchOver && (
              <p className="mt-3 flex items-start gap-2 rounded-xl border border-gray-100 px-3 py-2 text-xs text-gray-500">
                <Building2 className="mt-0.5 size-4 shrink-0" />
                {t("planLimit.branchesNote")}
              </p>
            )}

            {unitsOver && (
              <p className="mt-3 flex items-start gap-2 rounded-xl border border-gray-100 px-3 py-2 text-xs text-gray-500">
                <Gauge className="mt-0.5 size-4 shrink-0" />
                {t("planLimit.unitsNote")}
              </p>
            )}
          </div>

          <div className="space-y-2 border-t border-gray-100 p-5">
            {suggested.length > 0 && (
              <Button
                type="button"
                className="w-full bg-brand-primary text-white hover:bg-brand-primary/90"
                disabled={create.isPending}
                onClick={keepEverything}
              >
                {create.isPending && <Loader2 className="size-4 animate-spin" />}
                {keepLabel}
              </Button>
            )}
            <Dialog.Close asChild>
              <Button type="button" variant="ghost" className="w-full">
                {t("planLimit.pickLargerPlan")}
              </Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
