"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Dialog } from "radix-ui";
import { Building2, Loader2, UserMinus, UserX, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/infrastructure/http/api";
import { useRouter } from "@/i18n/navigation";
import { useDashboardPath } from "@/hooks/useDashboardPath";
import {
  useDeactivateStaff,
  useRemoveStaffFromBranch,
  useStaff,
} from "@/core/staff";
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
 * plan's limits (403 PLAN_CHANGE_OVER_LIMIT). Lets the owner resolve it inline:
 * keep everything by buying the missing branch bundles + seats together with the
 * plan (one combined payment), free up staff until they fit, or pick a larger
 * plan. Branches can't be freed inline (destructive) — they're covered by the
 * branch-bundle add-ons in the "keep everything" purchase.
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
  const { branchId } = useParams<{ branchId: string }>();
  const router = useRouter();
  const dashboardPath = useDashboardPath();

  const { data: staff = [], isLoading } = useStaff(organizationId, branchId);
  const deactivate = useDeactivateStaff();
  const removeStaff = useRemoveStaffFromBranch();
  const create = useCreatePayment(organizationId);

  const staffOver = info?.over.find((o) => o.resource === "staff");
  const branchOver = info?.over.find((o) => o.resource === "branches");
  const suggested = info?.suggested_add_ons ?? [];
  const branchSuggestion = suggested.find((s) => s.resource === "branches");
  const seatSuggestion = suggested.find((s) => s.resource === "staff");

  // Track seats freed this session against the server-authoritative excess, so
  // the fit check is correct even for multi-branch orgs (the inline list is
  // branch-scoped, but each freed seat lowers the org-wide count by one).
  const [freed, setFreed] = useState(0);
  // Reset the counter when the drawer is shown for a new overage.
  const [lastInfo, setLastInfo] = useState<PlanChangeOverLimit | null>(null);
  if (open && info !== lastInfo) {
    setLastInfo(info);
    setFreed(0);
  }

  const staffRemaining = Math.max(0, (staffOver?.excess ?? 0) - freed);
  const fits = !branchOver && staffRemaining === 0;

  const addParts: string[] = [];
  if (branchSuggestion) {
    addParts.push(
      t("planLimit.addBranches", { count: branchSuggestion.quantity }),
    );
  }
  if (seatSuggestion) {
    addParts.push(t("planLimit.addSeats", { count: seatSuggestion.quantity }));
  }
  const keepLabel = addParts.length
    ? `${t("planLimit.keepEverything")} (${addParts.join(", ")})`
    : t("planLimit.keepEverything");

  const busy =
    create.isPending || deactivate.isPending || removeStaff.isPending;

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

  function continueToPayment() {
    if (!plan) return;
    create.mutate({ plan: plan.plan, provider }, { onSuccess, onError });
  }

  /** Buy the whole suggested add-on set (branches + seats) alongside the plan. */
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

  function freeSeat(staffId: string, action: "deactivate" | "remove") {
    if (!organizationId || !branchId) return;
    const vars = { organizationId, branchId, staffId };
    const opts = { onSuccess: () => setFreed((n) => n + 1) };
    if (action === "deactivate") deactivate.mutate(vars, opts);
    else removeStaff.mutate(vars, opts);
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

            {staffOver && (
              <div className="mt-4">
                <p className="text-xs font-medium uppercase text-gray-400">
                  {t("planLimit.freeUp", { count: staffRemaining })}
                </p>
                <ul className="mt-2 space-y-2">
                  {isLoading ? (
                    <li className="flex items-center justify-center py-8 text-gray-400">
                      <Loader2 className="size-5 animate-spin" />
                    </li>
                  ) : (
                    staff.map((member) => (
                      <li
                        key={member.id}
                        className="flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-2"
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-semibold text-white">
                          {initials(member.firstName, member.lastName)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-brand-black">
                            {member.firstName} {member.lastName}
                          </p>
                          <p className="truncate text-xs text-gray-400">
                            {member.roleName}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => freeSeat(member.id, "deactivate")}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-500 transition hover:bg-gray-50 disabled:opacity-40"
                        >
                          <UserMinus className="size-3.5" />
                          {t("planLimit.deactivate")}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => freeSeat(member.id, "remove")}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50 disabled:opacity-40"
                        >
                          <UserX className="size-3.5" />
                          {t("planLimit.remove")}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}
          </div>

          <div className="space-y-2 border-t border-gray-100 p-5">
            {suggested.length > 0 && (
              <Button
                type="button"
                className="w-full bg-brand-primary text-white hover:bg-brand-primary/90"
                disabled={busy}
                onClick={keepEverything}
              >
                {create.isPending && <Loader2 className="size-4 animate-spin" />}
                {keepLabel}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={!fits || busy}
              onClick={continueToPayment}
            >
              {t("planLimit.continueToPayment")}
            </Button>
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

function initials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}
