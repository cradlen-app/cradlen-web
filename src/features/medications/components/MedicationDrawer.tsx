"use client";

import { useEffect } from "react";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import { medicationFormSchema, type MedicationFormValues } from "../lib/medications.schemas";
import type { Medication } from "../types/medications.types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medication: Medication | null;
  onSubmit: (values: MedicationFormValues) => Promise<void>;
  isPending: boolean;
}

export function MedicationDrawer({ open, onOpenChange, medication, onSubmit, isPending }: Props) {
  const t = useTranslations("medications.drawer");
  const isEdit = medication !== null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MedicationFormValues>({
    resolver: zodResolver(medicationFormSchema),
    defaultValues: { code: "", name: "", form: "", strength: "" },
  });

  useEffect(() => {
    if (!open) return;
    reset(
      isEdit
        ? {
            code: medication.code,
            name: medication.name,
            form: medication.form ?? "",
            strength: medication.strength ?? "",
          }
        : { code: "", name: "", form: "", strength: "" },
    );
  }, [open, isEdit, medication, reset]);

  const handleFormSubmit = handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/25 transition-opacity" />
        <Dialog.Content className="fixed inset-y-0 inset-e-0 z-[41] flex w-full max-w-[480px] flex-col bg-white shadow-2xl outline-none">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
            <div>
              <p className="text-xs text-gray-400">{t("breadcrumb")}</p>
              <Dialog.Title className="mt-0.5 text-base font-bold text-brand-black">
                {isEdit ? t("editTitle") : t("addTitle")}
              </Dialog.Title>
            </div>
            <Dialog.Close className="mt-0.5 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
              <X className="size-4" aria-hidden />
            </Dialog.Close>
          </div>

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">

              {/* Medicine / Code */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  {t("fields.medicine")} <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("code")}
                  disabled={isEdit}
                  placeholder={t("fields.medicinePlaceholder")}
                  className={cn(
                    "w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors",
                    "focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10",
                    "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-60",
                    errors.code ? "border-red-300" : "border-gray-200",
                  )}
                />
                {errors.code && (
                  <p className="mt-1 text-xs text-red-500">{errors.code.message}</p>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  {t("fields.name")} <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("name")}
                  placeholder={t("fields.namePlaceholder")}
                  className={cn(
                    "w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors",
                    "focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10",
                    errors.name ? "border-red-300" : "border-gray-200",
                  )}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>

              {/* Category — placeholder */}
              <PlaceholderField label={t("fields.category")} hint={t("fields.comingSoon")} />

              {/* Form + Strength */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    {t("fields.form")}{" "}
                    <span className="text-xs font-normal text-gray-400">
                      ({t("fields.optional")})
                    </span>
                  </label>
                  <input
                    {...register("form")}
                    placeholder={t("fields.formPlaceholder")}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    {t("fields.strength")}{" "}
                    <span className="text-xs font-normal text-gray-400">
                      ({t("fields.optional")})
                    </span>
                  </label>
                  <input
                    {...register("strength")}
                    placeholder={t("fields.strengthPlaceholder")}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                  />
                </div>
              </div>

              {/* Default Dose — placeholder */}
              <PlaceholderField label={t("fields.defaultDose")} hint={t("fields.comingSoon")} />

              {/* Medical Rep — placeholder */}
              <PlaceholderField label={t("fields.medicalRep")} hint={t("fields.comingSoon")} />

              {/* Assigned To — placeholder */}
              <PlaceholderField label={t("fields.assignedTo")} hint={t("fields.comingSoon")} />

              {/* Company — placeholder */}
              <PlaceholderField label={t("fields.company")} hint={t("fields.comingSoon")} />

              {/* Notes — placeholder (textarea) */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700 opacity-60">
                  {t("fields.notes")}{" "}
                  <span className="text-xs font-normal text-gray-400">({t("fields.comingSoon")})</span>
                </label>
                <textarea
                  disabled
                  rows={3}
                  title={t("fields.comingSoon")}
                  className="w-full cursor-not-allowed resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm opacity-60 outline-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-4">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  {t("cancel")}
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "…" : t("saveButton")}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function PlaceholderField({ label, hint }: { label: string; hint: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-gray-700 opacity-60">
        {label}{" "}
        <span className="text-xs font-normal text-gray-400">({hint})</span>
      </label>
      <input
        disabled
        title={hint}
        className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm opacity-60 outline-none"
      />
    </div>
  );
}
