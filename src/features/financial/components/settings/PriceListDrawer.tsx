"use client";

import { useEffect } from "react";
import { Dialog } from "radix-ui";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import { Button } from "@/components/ui/button";
import { useCreatePriceList } from "../../hooks/useCreatePriceList";
import { useUpdatePriceList } from "../../hooks/useUpdatePriceList";
import type { PriceList } from "../../types/financial.types";

// ── Schema ────────────────────────────────────────────────────────────────────

const priceListFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  currency: z.string().optional(),
  // TODO: replace with branch select using useBranches when available
  branch_id: z.string().optional(),
  is_default: z.boolean(),
  valid_from: z.string().optional(),
  valid_to: z.string().optional(),
});

type PriceListFormValues = z.infer<typeof priceListFormSchema>;

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputClass = cn(
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900",
  "placeholder:text-gray-400 outline-none transition-colors",
  "focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20",
);

/** Trim ISO date string to YYYY-MM-DD for <input type="date">. */
function toDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  priceList?: PriceList;
};

// ── Component ─────────────────────────────────────────────────────────────────

export function PriceListDrawer({ open, onOpenChange, mode, priceList }: Props) {
  const t = useTranslations("financial.priceLists");
  const tCommon = useTranslations("financial.common");
  const createMutation = useCreatePriceList();
  const updateMutation = useUpdatePriceList();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const form = useForm<PriceListFormValues>({
    resolver: zodResolver(priceListFormSchema),
    defaultValues: {
      name: "",
      currency: "EGP",
      branch_id: "",
      is_default: false,
      valid_from: "",
      valid_to: "",
    },
  });

  useEffect(() => {
    if (open && mode === "edit" && priceList) {
      form.reset({
        name: priceList.name,
        currency: priceList.currency,
        branch_id: priceList.branch_id ?? "",
        is_default: priceList.is_default,
        valid_from: toDateInput(priceList.valid_from),
        valid_to: toDateInput(priceList.valid_to),
      });
    } else if (open && mode === "create") {
      form.reset({
        name: "",
        currency: "EGP",
        branch_id: "",
        is_default: false,
        valid_from: "",
        valid_to: "",
      });
    }
  }, [open, mode, priceList, form]);

  function handleClose() {
    form.reset();
    onOpenChange(false);
  }

  const onSubmit = form.handleSubmit((data) => {
    if (mode === "create") {
      createMutation.mutate(
        {
          name: data.name,
          currency: data.currency || undefined,
          branch_id: data.branch_id || undefined,
          is_default: data.is_default,
          valid_from: data.valid_from || undefined,
          valid_to: data.valid_to || undefined,
        },
        { onSuccess: handleClose },
      );
    } else if (priceList) {
      updateMutation.mutate(
        {
          id: priceList.id,
          payload: {
            name: data.name,
            currency: data.currency || undefined,
            is_default: data.is_default,
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
                {mode === "create" ? t("newList") : t("editList")}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-gray-400">
                {mode === "create"
                  ? t("newListDescription")
                  : t("editListDescription")}
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
              {/* Name */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  {t("fields.name")} <span className="text-red-500">*</span>
                </label>
                <input
                  {...form.register("name")}
                  type="text"
                  placeholder={t("fields.namePlaceholder")}
                  className={cn(
                    inputClass,
                    form.formState.errors.name && "border-red-400",
                  )}
                />
                {form.formState.errors.name && (
                  <p className="mt-1 text-xs text-red-500">
                    {form.formState.errors.name.message}
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

              {/* Branch ID — text input (TODO: replace with useBranches select) */}
              {mode === "create" && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    {t("fields.branchId")}{" "}
                    <span className="text-gray-400">
                      {t("fields.branchIdHint")}
                    </span>
                  </label>
                  {/* TODO: replace with branch select using useBranches when available */}
                  <input
                    {...form.register("branch_id")}
                    type="text"
                    placeholder={t("fields.branchIdPlaceholder")}
                    className={inputClass}
                  />
                </div>
              )}

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

              {/* Is default */}
              <div className="flex items-center gap-3">
                <input
                  {...form.register("is_default")}
                  id="price-list-is-default"
                  type="checkbox"
                  className="size-4 rounded border-gray-300 accent-blue-600"
                />
                <label
                  htmlFor="price-list-is-default"
                  className="text-sm font-medium text-gray-700"
                >
                  {t("fields.setAsDefault")}
                </label>
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
                  t("createList")
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
