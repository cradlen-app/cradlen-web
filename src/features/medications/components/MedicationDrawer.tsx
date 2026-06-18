"use client";

import { useEffect, useMemo } from "react";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import { medicationFormSchema, type MedicationFormValues } from "../lib/medications.schemas";
import { MEDICATION_CATEGORY_OPTIONS, MEDICATION_FORM_OPTIONS, MEDICATION_STRENGTH_OPTIONS } from "../lib/medications.constants";
import { generateMedicationCode } from "../lib/medications.utils";
import { CreatableSelect } from "./CreatableSelect";
import { useMedicalReps } from "@/features/medical-rep/hooks/useMedicalReps";
import type { Medication } from "../types/medications.types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medication: Medication | null;
  onSubmit: (values: MedicationFormValues) => Promise<void>;
  isPending: boolean;
  /** Pre-fill values for create mode (e.g. the drug name typed elsewhere). */
  createDefaults?: Partial<MedicationFormValues>;
}

export function MedicationDrawer({
  open,
  onOpenChange,
  medication,
  onSubmit,
  isPending,
  createDefaults,
}: Props) {
  const t = useTranslations("medications.drawer");
  const isEdit = medication !== null;

  const { data: repsData } = useMedicalReps({ page: 1, limit: 100, search: "" });

  // The dropdown only fetches the first 100 reps; ensure the medication's
  // currently-linked rep is always present so it renders by name (not a bare id)
  // even when it falls outside that page.
  const linkedRep = medication?.medical_reps?.[0];
  const repOptions = useMemo(() => {
    const list = repsData?.data ?? [];
    return linkedRep && !list.some((r) => r.id === linkedRep.id)
      ? [linkedRep, ...list]
      : list;
  }, [repsData, linkedRep]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MedicationFormValues>({
    resolver: zodResolver(medicationFormSchema),
    defaultValues: {
      code: "", name: "", genericName: "", form: "", strength: "",
      category: "", company: "", notes: "",
      defaultDoseAmount: "", defaultDoseUnit: "",
      defaultDoseFrequency: "", defaultDoseRoute: "",
      medicalRepId: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    reset(
      isEdit
        ? {
            code: medication.code,
            name: medication.name,
            genericName: medication.generic_name ?? "",
            form: medication.form ?? "",
            strength: medication.strength ?? "",
            category: medication.category ?? "",
            company: medication.company ?? "",
            notes: medication.notes ?? "",
            defaultDoseAmount:
              medication.default_dose_amount != null
                ? String(medication.default_dose_amount)
                : "",
            defaultDoseUnit: medication.default_dose_unit ?? "",
            defaultDoseFrequency: medication.default_dose_frequency ?? "",
            defaultDoseRoute: medication.default_dose_route ?? "",
            medicalRepId: medication.medical_reps?.[0]?.id ?? "",
          }
        : {
            code: "", name: "", genericName: "", form: "", strength: "",
            category: "", company: "", notes: "",
            defaultDoseAmount: "", defaultDoseUnit: "",
            defaultDoseFrequency: "", defaultDoseRoute: "",
            medicalRepId: "",
            ...createDefaults,
          },
    );
  }, [open, isEdit, medication, reset, createDefaults]);

  const watchedName = watch("name");
  const watchedStrength = watch("strength");

  useEffect(() => {
    if (isEdit) return;
    const code = generateMedicationCode(watchedName ?? "", watchedStrength ?? "");
    setValue("code", code);
  }, [watchedName, watchedStrength, isEdit, setValue]);

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

              {/* Generic Name */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  {t("fields.genericName")}{" "}
                  <span className="text-xs font-normal text-gray-400">
                    ({t("fields.optional")})
                  </span>
                </label>
                <input
                  {...register("genericName")}
                  placeholder={t("fields.genericNamePlaceholder")}
                  className={cn(
                    "w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors",
                    "focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10",
                    "border-gray-200",
                  )}
                />
              </div>

              {/* Category */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  {t("fields.category")}{" "}
                  <span className="text-xs font-normal text-gray-400">
                    ({t("fields.optional")})
                  </span>
                </label>
                <Controller
                  control={control}
                  name="category"
                  render={({ field }) => (
                    <CreatableSelect
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      options={MEDICATION_CATEGORY_OPTIONS}
                      addOptionLabel={(v) => t("fields.addOption", { value: v })}
                    />
                  )}
                />
              </div>

              {/* Form + Strength */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    {t("fields.form")}{" "}
                    <span className="text-xs font-normal text-gray-400">
                      ({t("fields.optional")})
                    </span>
                  </label>
                  <Controller
                    control={control}
                    name="form"
                    render={({ field }) => (
                      <CreatableSelect
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        options={MEDICATION_FORM_OPTIONS}
                        placeholder={t("fields.formPlaceholder")}
                        addOptionLabel={(v) => t("fields.addOption", { value: v })}
                      />
                    )}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    {t("fields.strength")}{" "}
                    <span className="text-xs font-normal text-gray-400">
                      ({t("fields.optional")})
                    </span>
                  </label>
                  <Controller
                    control={control}
                    name="strength"
                    render={({ field }) => (
                      <CreatableSelect
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        options={MEDICATION_STRENGTH_OPTIONS}
                        placeholder={t("fields.strengthPlaceholder")}
                        addOptionLabel={(v) => t("fields.addOption", { value: v })}
                      />
                    )}
                  />
                </div>
              </div>

              {/* Default Dose */}
              <div>
                <p className="mb-2 text-sm font-semibold text-gray-700">
                  {t("fields.defaultDose")}{" "}
                  <span className="text-xs font-normal text-gray-400">
                    ({t("fields.optional")})
                  </span>
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">
                      {t("fields.defaultDoseAmount")}
                    </label>
                    <input
                      {...register("defaultDoseAmount")}
                      type="number"
                      step="any"
                      min="0"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">
                      {t("fields.defaultDoseUnit")}
                    </label>
                    <input
                      {...register("defaultDoseUnit")}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">
                      {t("fields.defaultDoseFrequency")}
                    </label>
                    <input
                      {...register("defaultDoseFrequency")}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">
                      {t("fields.defaultDoseRoute")}
                    </label>
                    <input
                      {...register("defaultDoseRoute")}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                    />
                  </div>
                </div>
              </div>

              {/* Medical Rep */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  {t("fields.medicalRep")}{" "}
                  <span className="text-xs font-normal text-gray-400">
                    ({t("fields.optional")})
                  </span>
                </label>
                <Controller
                  control={control}
                  name="medicalRepId"
                  render={({ field }) => (
                    <select
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none transition-colors focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                    >
                      <option value="">{t("fields.medicalRepPlaceholder")}</option>
                      {repOptions.map((rep) => (
                        <option key={rep.id} value={rep.id}>
                          {rep.full_name}{rep.company_name ? ` — ${rep.company_name}` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                />
              </div>

              {/* Company */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  {t("fields.company")}{" "}
                  <span className="text-xs font-normal text-gray-400">
                    ({t("fields.optional")})
                  </span>
                </label>
                <input
                  {...register("company")}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  {t("fields.notes")}{" "}
                  <span className="text-xs font-normal text-gray-400">
                    ({t("fields.optional")})
                  </span>
                </label>
                <textarea
                  {...register("notes")}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
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

