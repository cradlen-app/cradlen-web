"use client";

import { useState } from "react";
import { Dialog } from "radix-ui";
import { Loader2, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/common/utils/utils";
import { ApiError } from "@/infrastructure/http/api";
import { useRouter } from "@/i18n/navigation";
import { useDashboardPath } from "@/hooks/useDashboardPath";
import { useCreatePayment } from "../hooks/useSubscription";
import { formatMoney } from "../lib/format";
import { saveInstructions } from "../lib/instructions-store";
import type { PaymentProvider, Plan } from "../lib/subscriptions.types";

const PROVIDERS: PaymentProvider[] = ["INSTAPAY", "WALLET"];

export function CreatePaymentDialog({
  organizationId,
  plan,
  open,
  onOpenChange,
}: {
  organizationId: string | undefined;
  plan: Plan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("subscriptions");
  const locale = useLocale();
  const router = useRouter();
  const dashboardPath = useDashboardPath();
  const create = useCreatePayment(organizationId);
  const [provider, setProvider] = useState<PaymentProvider>("INSTAPAY");

  const yearly = plan?.prices.find((p) => p.billing_interval === "YEARLY");

  function submit() {
    if (!plan) return;
    create.mutate(
      { plan: plan.plan, provider },
      {
        onSuccess: (res) => {
          if (res.data.instructions) {
            saveInstructions(res.data.payment.id, res.data.instructions);
          }
          onOpenChange(false);
          router.push(
            dashboardPath(
              `/settings/subscription/payments/${res.data.payment.id}`,
            ) as Parameters<typeof router.push>[0],
          );
        },
        onError: (error) =>
          toast.error(
            error instanceof ApiError
              ? (error.messages[0] ?? t("createDialog.error"))
              : t("createDialog.error"),
          ),
      },
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
                {t("createDialog.title", { plan: plan?.plan ?? "" })}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-gray-400">
                {yearly
                  ? t("createDialog.description", {
                      amount: formatMoney(yearly.price, yearly.currency, locale),
                    })
                  : t("createDialog.descriptionNoPrice")}
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-50 hover:text-brand-black">
              <X className="size-5" />
            </Dialog.Close>
          </div>

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

          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button type="button" variant="outline">
                {t("createDialog.cancel")}
              </Button>
            </Dialog.Close>
            <Button
              type="button"
              className="bg-brand-primary text-white hover:bg-brand-primary/90"
              disabled={create.isPending || !plan}
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
