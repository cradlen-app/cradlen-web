"use client";

import { useState, useEffect } from "react";
import { Dialog } from "radix-ui";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import { Button } from "@/components/ui/button";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { useCreateProviderOverride } from "../../hooks/useCreateProviderOverride";
import { useUpdateProviderOverride } from "../../hooks/useUpdateProviderOverride";
import type { ProviderOverride } from "../../types/financial.types";
import {
  ServiceComboboxField,
  inputClass,
} from "./provider-override-combobox";

// ── Schema ────────────────────────────────────────────────────────────────────

const overrideFormSchema = z.object({
  service_id: z.string().min(1, "Service is required"),
  service_name: z.string().optional(), // display-only
  /** Backend field is `price` (not `unit_price`). */
  price: z.number().nonnegative("Price must be 0 or more"),
  currency: z.string().optional(),
  valid_from: z.string().optional(),
  valid_to: z.string().optional(),
});

type OverrideFormValues = z.infer<typeof overrideFormSchema>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  override?: ProviderOverride;
  profileId: string;
};

// ── Component ─────────────────────────────────────────────────────────────────

export function ProviderOverrideDrawer({
  open,
  onOpenChange,
  mode,
  override,
  profileId,
}: Props) {
  const t = useTranslations("financial.myPrices");
  const tCommon = useTranslations("financial.common");
  const orgId = useAuthContextStore((s) => s.organizationId) ?? "";
  const createMutation = useCreateProviderOverride(profileId);
  const updateMutation = useUpdateProviderOverride(profileId);
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const form = useForm<OverrideFormValues>({
    resolver: zodResolver(overrideFormSchema),
    defaultValues: {
      service_id: "",
      service_name: "",
      price: 0,
      currency: "EGP",
      valid_from: "",
      valid_to: "",
    },
  });

  // Reactive currency for the Price label — `useWatch` is React Compiler-safe
  // (unlike `form.watch()` which returns a non-memoizable function).
  const watchedCurrency = useWatch({
    control: form.control,
    name: "currency",
  });

  // For create mode: tracks the name of the service chosen from the combobox
  const [selectedServiceName, setSelectedServiceName] = useState("");

  useEffect(() => {
    if (open && mode === "edit" && override) {
      form.reset({
        service_id: override.service_id,
        service_name: override.service?.name ?? "",
        price: override.price,
        currency: override.currency,
        valid_from: toDateInput(override.valid_from),
        valid_to: toDateInput(override.valid_to),
      });
    } else if (open && mode === "create") {
      form.reset({
        service_id: "",
        service_name: "",
        price: 0,
        currency: "EGP",
        valid_from: "",
        valid_to: "",
      });
      Promise.resolve().then(() => setSelectedServiceName(""));
    }
  }, [open, mode, override, form]);

  // Derive displayed service name from props (edit) or combobox selection (create)
  const displayServiceName =
    mode === "edit" ? (override?.service?.name ?? "") : selectedServiceName;

  function handleClose() {
    form.reset();
    onOpenChange(false);
  }

  const onSubmit = form.handleSubmit((data) => {
    if (mode === "create") {
      createMutation.mutate(
        {
          service_id: data.service_id,
          price: data.price,
          currency: data.currency || undefined,
          valid_from: data.valid_from || undefined,
          valid_to: data.valid_to || undefined,
        },
        { onSuccess: handleClose },
      );
    } else if (override) {
      updateMutation.mutate(
        {
          id: override.id,
          payload: {
            price: data.price,
            currency: data.currency || undefined,
            valid_from: data.valid_from || undefined,
            valid_to: data.valid_to || undefined,
          },
        },
        { onSuccess: handleClose },
      );
    }
  });

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/35" />
        <Dialog.Content className="fixed inset-y-0 inset-e-0 z-51 flex w-full max-w-md flex-col bg-white shadow-2xl outline-none">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5">
            <div className="min-w-0">
              <Dialog.Title className="text-lg font-medium text-gray-900">
                {mode === "create"
                  ? t("addOverrideTitle")
                  : t("editOverride")}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-gray-400">
                {mode === "create"
                  ? t("addOverrideDescription")
                  : t("editOverrideDescription")}
              </Dialog.Description>
            </div>
            <Dialog.Close
              className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-50 hover:text-gray-900"
              onClick={handleClose}
            >
              <X className="size-5" aria-hidden="true" />
            </Dialog.Close>
          </div>

          {/* Form */}
          <form
            onSubmit={onSubmit}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Service combobox — disabled in edit mode */}
              {mode === "create" ? (
                <ServiceComboboxField
                  orgId={orgId}
                  displayValue={displayServiceName}
                  onChange={(id, name) => {
                    form.setValue("service_id", id);
                    form.setValue("service_name", name);
                    setSelectedServiceName(name);
                  }}
                  error={form.formState.errors.service_id?.message}
                />
              ) : (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    {t("fields.service")}
                  </label>
                  <input
                    type="text"
                    value={override?.service?.name ?? ""}
                    readOnly
                    className={cn(inputClass, "bg-gray-50 text-gray-500")}
                  />
                </div>
              )}

              {/* Price */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  {t("fields.priceWithCurrency", { currency: watchedCurrency || "EGP" })}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  {...form.register("price", { valueAsNumber: true })}
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder={t("fields.pricePlaceholder")}
                  className={cn(
                    inputClass,
                    form.formState.errors.price && "border-red-400",
                  )}
                />
                {form.formState.errors.price && (
                  <p className="mt-1 text-xs text-red-500">
                    {form.formState.errors.price.message}
                  </p>
                )}
              </div>

              {/* Currency */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  {t("fields.currency")}
                </label>
                <input
                  {...form.register("currency")}
                  type="text"
                  placeholder={t("fields.currencyPlaceholder")}
                  className={inputClass}
                />
              </div>

              {/* Valid from / Valid to */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    {t("fields.validFrom")} <span className="text-gray-400">{tCommon("optional")}</span>
                  </label>
                  <input
                    {...form.register("valid_from")}
                    type="date"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    {t("fields.validTo")} <span className="text-gray-400">{tCommon("optional")}</span>
                  </label>
                  <input
                    {...form.register("valid_to")}
                    type="date"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 border-t border-gray-100 p-5">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSaving}
              >
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    {tCommon("saving")}
                  </>
                ) : mode === "create" ? (
                  t("addOverride")
                ) : (
                  tCommon("saveChanges")
                )}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
