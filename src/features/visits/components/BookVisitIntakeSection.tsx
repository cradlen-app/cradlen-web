"use client";

import { useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import {
  CHIEF_COMPLAINT_CATEGORIES,
  CHIEF_COMPLAINT_MAX,
  VITAL_SEVERITY,
  type ChiefComplaintCategory,
  type VitalSeverity,
} from "../lib/visits.constants";
import type { BookVisitFormValues } from "../lib/visits.schemas";
import { fieldClass, FieldError, SectionTitle } from "./book-visit-shared";

function computeBmi(weightKg: unknown, heightCm: unknown): number | null {
  const w = Number(weightKg);
  const h = Number(heightCm);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
  const meters = h / 100;
  return Math.round((w / (meters * meters)) * 10) / 10;
}

export function BookVisitIntakeSection() {
  const t = useTranslations("visits.create.intake");
  const {
    register,
    setValue,
    control,
    formState: { errors },
  } = useFormContext<BookVisitFormValues>();

  const categories = (useWatch({ control, name: "chiefComplaintCategories" }) ?? []) as ChiefComplaintCategory[];
  const severity = useWatch({ control, name: "chiefComplaintSeverity" });
  const chiefComplaintValue = useWatch({ control, name: "chiefComplaint" }) ?? "";
  const weightKg = useWatch({ control, name: "vitalsWeightKg" });
  const heightCm = useWatch({ control, name: "vitalsHeightCm" });

  const bmi = useMemo(() => computeBmi(weightKg, heightCm), [weightKg, heightCm]);

  function toggleCategory(category: ChiefComplaintCategory) {
    const next = categories.includes(category)
      ? categories.filter((c) => c !== category)
      : [...categories, category];
    setValue("chiefComplaintCategories", next.length ? next : undefined, {
      shouldDirty: true,
    });
  }

  return (
    <div className="space-y-5">
      {/* Chief complaint */}
      <section className="space-y-3">
        <SectionTitle title={t("chiefComplaint.title")} />

        {/* Categories */}
        <div>
          <span className="text-xs font-medium text-brand-black">
            {t("chiefComplaint.categoriesLabel")}
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {CHIEF_COMPLAINT_CATEGORIES.map((cat) => {
              const active = categories.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  aria-pressed={active}
                  className={cn(
                    "inline-flex h-8 items-center rounded-full border px-3 text-[11px] font-medium transition-colors",
                    active
                      ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                      : "border-gray-200 bg-white text-gray-500 hover:border-brand-primary/30 hover:text-brand-black",
                  )}
                >
                  {t(`categories.${cat}`)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Narrative */}
        <label className="block">
          <span className="text-xs font-medium text-brand-black">
            {t("chiefComplaint.narrativeLabel")}
          </span>
          <textarea
            {...register("chiefComplaint")}
            rows={3}
            maxLength={CHIEF_COMPLAINT_MAX}
            placeholder={t("chiefComplaint.narrativePlaceholder")}
            className={cn(fieldClass, "h-auto resize-none border-b py-2")}
          />
          <div className="flex items-center justify-between pt-1">
            <FieldError message={errors.chiefComplaint?.message} />
            <span className="ms-auto text-[11px] text-gray-400 tabular-nums">
              {chiefComplaintValue.length}/{CHIEF_COMPLAINT_MAX}
            </span>
          </div>
        </label>

        {/* Onset / Duration */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium text-brand-black">
              {t("chiefComplaint.onset")}
            </span>
            <input
              {...register("chiefComplaintOnset")}
              type="text"
              maxLength={256}
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-brand-black">
              {t("chiefComplaint.duration")}
            </span>
            <input
              {...register("chiefComplaintDuration")}
              type="text"
              maxLength={256}
              className={fieldClass}
            />
          </label>
        </div>

        {/* Severity — full-width segmented row */}
        <div>
          <span className="text-xs font-medium text-brand-black">
            {t("chiefComplaint.severityLabel")}
          </span>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {VITAL_SEVERITY.map((s) => {
              const active = severity === s;
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    setValue(
                      "chiefComplaintSeverity",
                      active ? undefined : (s as VitalSeverity),
                      { shouldDirty: true },
                    )
                  }
                  className={cn(
                    "h-9 rounded-lg border px-3 text-xs font-medium transition-colors",
                    active
                      ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                      : "border-gray-100 bg-gray-50/70 text-gray-500 hover:border-brand-primary/30 hover:bg-white hover:text-brand-black",
                  )}
                >
                  {t(`chiefComplaint.severity.${s}`)}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Vitals */}
      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <SectionTitle title={t("vitals.title")} />
          </div>
          {bmi != null && (
            <span className="inline-flex shrink-0 items-center rounded-full bg-brand-primary/10 px-2 py-0.5 text-[11px] font-medium text-brand-primary tabular-nums">
              {t("vitals.bmi", { value: bmi.toFixed(1) })}
            </span>
          )}
        </div>

        {/* Blood pressure (paired) */}
        <div>
          <span className="text-xs font-medium text-brand-black">
            {t("vitals.bloodPressure")}
            <span className="ms-1 text-[11px] text-gray-300">mmHg</span>
          </span>
          <div className="mt-1 flex items-center gap-2">
            <input
              {...register("vitalsSystolicBp")}
              type="number"
              step="1"
              inputMode="numeric"
              placeholder={t("vitals.systolicShort")}
              className={cn(fieldClass, "min-w-0 flex-1")}
              aria-label={t("vitals.systolic")}
            />
            <span className="text-sm text-gray-300">/</span>
            <input
              {...register("vitalsDiastolicBp")}
              type="number"
              step="1"
              inputMode="numeric"
              placeholder={t("vitals.diastolicShort")}
              className={cn(fieldClass, "min-w-0 flex-1")}
              aria-label={t("vitals.diastolic")}
            />
          </div>
          <FieldError
            message={
              (errors.vitalsSystolicBp?.message as string | undefined) ??
              (errors.vitalsDiastolicBp?.message as string | undefined)
            }
          />
        </div>

        {/* Pulse / Weight / Height */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
          <VitalField label={t("vitals.pulse")} unit="bpm" name="vitalsPulse" />
          <VitalField
            label={t("vitals.weight")}
            unit="kg"
            step="0.1"
            name="vitalsWeightKg"
          />
          <VitalField
            label={t("vitals.height")}
            unit="cm"
            step="0.1"
            name="vitalsHeightCm"
          />
        </div>
      </section>
    </div>
  );
}

type VitalKey = "vitalsPulse" | "vitalsWeightKg" | "vitalsHeightCm";

function VitalField({
  label,
  unit,
  name,
  step = "1",
}: {
  label: string;
  unit: string;
  name: VitalKey;
  step?: string;
}) {
  const {
    register,
    formState: { errors },
  } = useFormContext<BookVisitFormValues>();
  const fieldError = errors[name];
  return (
    <label className="block">
      <span className="text-xs font-medium text-brand-black">
        {label}
        <span className="ms-1 text-[11px] text-gray-300">{unit}</span>
      </span>
      <input
        {...register(name)}
        type="number"
        step={step}
        inputMode="decimal"
        className={fieldClass}
      />
      <FieldError message={fieldError?.message as string | undefined} />
    </label>
  );
}
