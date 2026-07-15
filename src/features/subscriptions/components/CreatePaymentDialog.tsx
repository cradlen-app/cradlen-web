"use client";

import { useState } from "react";
import { Dialog } from "radix-ui";
import { Loader2, Minus, Plus, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/common/utils/utils";
import { ApiError } from "@/infrastructure/http/api";
import {
  getPlanChangeOverLimit,
  type PlanChangeOverLimit,
} from "@/common/errors/subscription-errors";
import { useRouter } from "@/i18n/navigation";
import { useDashboardPath } from "@/hooks/useDashboardPath";
import { useCreatePayment } from "../hooks/useSubscription";
import { formatMoney } from "../lib/format";
import { prorateAddOnTotal } from "../lib/prorate";
import { saveInstructions } from "../lib/instructions-store";
import type {
  AvailableAddOn,
  PaymentProvider,
  Plan,
} from "../lib/subscriptions.types";

const PROVIDERS: PaymentProvider[] = ["INSTAPAY", "WALLET"];

type PlanMode = {
  mode: "plan";
  plan: Plan | null;
  addOn?: never;
  currentPlanCode?: never;
  subscriptionEndsAt?: never;
};

type AddOnMode = {
  mode: "addon";
  addOn: AvailableAddOn | null;
  currentPlanCode: string;
  /** Current term end — used to show the same prorated total the API charges. */
  subscriptionEndsAt?: string | null;
  plan?: never;
};

type CreatePaymentDialogProps = {
  organizationId: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Called (plan mode only) when the purchase is blocked because the org is over
   * the target plan's limits. The parent opens the resolution drawer with the
   * selected plan + provider so the owner can free seats or buy them.
   */
  onOverLimit?: (info: PlanChangeOverLimit, provider: PaymentProvider) => void;
} & (PlanMode | AddOnMode);

export function CreatePaymentDialog(props: CreatePaymentDialogProps) {
  const { organizationId, open, onOpenChange } = props;
  const t = useTranslations("subscriptions");
  const locale = useLocale();
  const router = useRouter();
  const dashboardPath = useDashboardPath();
  const create = useCreatePayment(organizationId);
  const [provider, setProvider] = useState<PaymentProvider>("INSTAPAY");
  const [quantity, setQuantity] = useState(1);

  const isAddOn = props.mode === "addon";
  const addOn = isAddOn ? props.addOn : null;
  const plan = !isAddOn ? props.plan : null;
  const allowQuantity = addOn != null;

  // Reset the stepper when the dialog opens onto a new target, without an
  // effect (React's "adjust state during render" pattern).
  const target = open ? (addOn?.id ?? plan?.id ?? null) : null;
  const [lastTarget, setLastTarget] = useState<string | null>(null);
  if (target !== lastTarget) {
    setLastTarget(target);
    setQuantity(1);
  }

  const yearly = plan?.prices.find((p) => p.billing_interval === "YEARLY");

  const heading = isAddOn
    ? t("createDialog.addOnTitle", {
        addOn: addOn ? t(`addOns.kinds.${addOn.kind}`) : "",
      })
    : t("createDialog.title", {
        plan: plan ? t(`planNames.${plan.plan}`) : "",
      });

  const addOnTotal =
    (addOn &&
      prorateAddOnTotal(addOn.price, quantity, props.subscriptionEndsAt)) ??
    (addOn && Number.isFinite(Number(addOn.price))
      ? String(Number(addOn.price) * quantity)
      : (addOn?.price ?? ""));

  const description = isAddOn
    ? addOn
      ? t("createDialog.addOnDescription", {
          amount: formatMoney(addOnTotal, addOn.currency, locale),
        })
      : ""
    : yearly
      ? t("createDialog.description", {
          amount: formatMoney(yearly.price, yearly.currency, locale),
        })
      : t("createDialog.descriptionNoPrice");

  const disabled =
    create.isPending || (isAddOn ? !addOn : !plan);

  function submit() {
    if (isAddOn) {
      if (!addOn) return;
      create.mutate(
        {
          plan: props.currentPlanCode,
          provider,
          add_on_code: addOn.code,
          quantity: allowQuantity ? quantity : 1,
        },
        { onSuccess, onError },
      );
      return;
    }
    if (!plan) return;
    create.mutate({ plan: plan.plan, provider }, { onSuccess, onError });
  }

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
    // A blocked plan downgrade hands off to the resolution drawer instead of a
    // toast — the owner can free seats, buy seats, or pick a larger plan.
    const overLimit = !isAddOn ? getPlanChangeOverLimit(error) : null;
    if (overLimit && props.onOverLimit) {
      onOpenChange(false);
      props.onOverLimit(overLimit, provider);
      return;
    }
    toast.error(
      error instanceof ApiError
        ? (error.messages[0] ?? t("createDialog.error"))
        : t("createDialog.error"),
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/35" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-51 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-2xl outline-none">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Dialog.Title className="text-lg font-medium text-brand-black">
                {heading}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-gray-400">
                {description}
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-50 hover:text-brand-black">
              <X className="size-5" />
            </Dialog.Close>
          </div>

          {allowQuantity && (
            <div className="mt-5 flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
              <span className="text-sm font-medium text-brand-black">
                {t("addOns.quantity")}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="decrease"
                  className="flex size-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:opacity-40"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-6 text-center text-sm font-medium tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  aria-label="increase"
                  className="flex size-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50"
                  onClick={() => setQuantity((q) => q + 1)}
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>
          )}

          <fieldset className="mt-5">
            <legend className="mb-2 text-xs font-medium uppercase text-gray-400">
              {t("createDialog.provider")}
            </legend>
            <div className="grid gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProvider(p)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-4 py-3 text-start text-sm font-medium transition",
                    provider === p
                      ? "border-brand-primary bg-brand-primary/5 text-brand-black"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50",
                  )}
                >
                  <span>{t(`createDialog.providers.${p}`)}</span>
                  <span
                    className={cn(
                      "size-4 rounded-full border",
                      provider === p
                        ? "border-brand-primary bg-brand-primary"
                        : "border-gray-300",
                    )}
                  />
                </button>
              ))}
            </div>
          </fieldset>

          {isAddOn && (
            <p className="mt-3 text-xs text-gray-400">{t("addOns.prorated")}</p>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button type="button" variant="outline">
                {t("createDialog.cancel")}
              </Button>
            </Dialog.Close>
            <Button
              type="button"
              className="bg-brand-primary text-white hover:bg-brand-primary/90"
              disabled={disabled}
              onClick={submit}
            >
              {create.isPending && <Loader2 className="size-4 animate-spin" />}
              {t("createDialog.submit")}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
