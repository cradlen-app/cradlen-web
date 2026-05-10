"use client";

import { useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  CHIEF_COMPLAINT_CATEGORIES,
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

  const categories = useWatch({ control, name: "chiefComplaintCategories" }) ?? [];
  const severity = useWatch({ control, name: "chiefComplaintSeverity" });
  const weightKg = useWatch({ control, name: "vitalsWeightKg" });
  const heightCm = useWatch({ control, name: "vitalsHeightCm" });

  const bmi = useMemo(() => computeBmi(weightKg, heightCm), [weightKg, heightCm]);

  function toggleCategory(category: ChiefComplaintCategory) {
    const current = (categories as ChiefComplaintCategory[]) ?? [];
    const next = current.includes(category)
      ? current.filter((c) => c !== category)
      : [...current, category];
    setValue("chiefComplaintCategories", next.length ? next : undefined, {
      shouldDirty: true,
    });
  }

  return (
    <div className="space-y-5">
      {/* Chief complaint */}
      <section className="space-y-3">
        <SectionTitle title={t("chiefComplaint.title")} />

        <div>
          <p className="mb-2 text-[11px] text-gray-400">{t("chiefComplaint.categoriesLabel")}</p>
          <div className="flex flex-wrap gap-1.5">
            {CHIEF_COMPLAINT_CATEGORIES.map((cat) => {
              const active = (categories as ChiefComplaintCategory[]).includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                    active
                      ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                      : "border-gray-200 bg-white text-gray-500 hover:border-brand-primary/30 hover:text-brand-black",
                  )}
                  aria-pressed={active}
                >
                  {t(`categories.${cat}`)}
                </button>
              );
            })}
          </div>
        </div>

        <label className="block">
          <span className="text-[11px] text-gray-400">{t("chiefComplaint.narrativeLabel")}</span>
          <textarea
            {...register("chiefComplaint")}
            rows={3}
            maxLength={5000}
            placeholder={t("chiefComplaint.narrativePlaceholder")}
            className={cn(fieldClass, "h-auto resize-none border-b py-2")}
          />
          <FieldError message={errors.chiefComplaint?.message} />
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="text-[11px] text-gray-400">{t("chiefComplaint.onset")}</span>
            <input
              {...register("chiefComplaintOnset")}
              type="text"
              maxLength={256}
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className="text-[11px] text-gray-400">{t("chiefComplaint.duration")}</span>
            <input
              {...register("chiefComplaintDuration")}
              type="text"
              maxLength={256}
              className={fieldClass}
            />
          </label>
          <div>
            <span className="text-[11px] text-gray-400">{t("chiefComplaint.severityLabel")}</span>
            <div className="mt-1 grid grid-cols-3 gap-1">
              {VITAL_SEVERITY.map((s) => {
                const active = severity === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() =>
                      setValue("chiefComplaintSeverity", active ? undefined : (s as VitalSeverity), {
                        shouldDirty: true,
                      })
                    }
                    className={cn(
                      "h-8 rounded-md border text-[11px] font-medium transition-colors",
                      active
                        ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                        : "border-gray-200 bg-white text-gray-500 hover:border-brand-primary/30 hover:text-brand-black",
                    )}
                    aria-pressed={active}
                  >
                    {t(`chiefComplaint.severity.${s}`)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Vitals */}
      <section className="space-y-3">
        <SectionTitle title={t("vitals.title")} />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <VitalField label={t("vitals.systolic")} unit="mmHg" name="vitalsSystolicBp" />
          <VitalField label={t("vitals.diastolic")} unit="mmHg" name="vitalsDiastolicBp" />
          <VitalField label={t("vitals.pulse")} unit="bpm" name="vitalsPulse" />
          <VitalField
            label={t("vitals.temperature")}
            unit="°C"
            step="0.1"
            name="vitalsTemperatureC"
          />
          <VitalField label={t("vitals.respiratoryRate")} unit="rpm" name="vitalsRespiratoryRate" />
          <VitalField label={t("vitals.spo2")} unit="%" name="vitalsSpo2" />
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

        {bmi != null && (
          <p className="text-[11px] text-gray-500">
            {t("vitals.bmi", { value: bmi.toFixed(1) })}
          </p>
        )}
      </section>
    </div>
  );
}

type VitalKey =
  | "vitalsSystolicBp"
  | "vitalsDiastolicBp"
  | "vitalsPulse"
  | "vitalsTemperatureC"
  | "vitalsRespiratoryRate"
  | "vitalsSpo2"
  | "vitalsWeightKg"
  | "vitalsHeightCm";

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
      <span className="text-[11px] text-gray-400">
        {label} <span className="text-gray-300">({unit})</span>
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
