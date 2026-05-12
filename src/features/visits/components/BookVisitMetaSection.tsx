"use client";

import { Stethoscope } from "lucide-react";
import { useTranslations } from "next-intl";
import type { UseFormRegister, UseFormSetValue, FieldErrors } from "react-hook-form";
import { cn } from "@/common/utils/utils";
import type { StaffMember } from "@/core/staff/api";
import { VISIT_PRIORITY } from "../lib/visits.constants";
import type { BookVisitFormValues } from "../lib/visits.schemas";
import type { ApiVisitType, ApiVisitPriority } from "../types/visits.api.types";
import { fieldClass, SectionTitle, FieldError } from "./book-visit-shared";

type Props = {
  register: UseFormRegister<BookVisitFormValues>;
  errors: FieldErrors<BookVisitFormValues>;
  setValue: UseFormSetValue<BookVisitFormValues>;
  visitType: ApiVisitType;
  priority: ApiVisitPriority;
  typeOptions: Array<{ value: ApiVisitType; label: string }>;
  priorityOptions: Array<{ value: ApiVisitPriority; label: string }>;
  doctors: StaffMember[];
  doctorHint: string | null;
};

export function BookVisitMetaSection({
  register,
  errors,
  setValue,
  visitType,
  priority,
  typeOptions,
  priorityOptions,
  doctors,
  doctorHint,
}: Props) {
  const t = useTranslations("visits");

  return (
    <section className="space-y-3">
      <SectionTitle title={t("create.sectionVisitMeta")} />

      <div className="grid grid-cols-2 gap-x-8 gap-y-3">
        <label className="block">
          <span className="text-xs font-medium text-brand-black">{t("create.fields.doctor")}</span>
          <div className="relative">
            <Stethoscope
              className="pointer-events-none absolute inset-s-0 top-1/2 size-3.5 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <select
              {...register("assignedDoctorId")}
              className={cn(fieldClass, "ps-5")}
            >
              <option value="">{t("create.fields.selectDoctor")}</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {`${d.firstName} ${d.lastName}`.trim() || d.email}
                </option>
              ))}
            </select>
          </div>
          <FieldError message={errors.assignedDoctorId?.message} />
          {doctorHint && (
            <p className="pt-1 text-[11px] text-gray-400">{doctorHint}</p>
          )}
        </label>

        <label className="block">
          <span className="text-xs font-medium text-brand-black">{t("create.fields.scheduledAt")}</span>
          <input
            {...register("scheduledAt")}
            type="datetime-local"
            className={fieldClass}
          />
        </label>

        <div className="col-span-2">
          <span className="text-xs font-medium text-brand-black">{t("create.fields.visitType")}</span>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {typeOptions.map((option) => {
              const isActive = visitType === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setValue("visitType", option.value, { shouldDirty: true })}
                  className={cn(
                    "h-9 rounded-lg border px-2 text-xs font-medium transition-colors",
                    isActive
                      ? "border-brand-primary bg-brand-primary text-white"
                      : "border-gray-100 bg-gray-50/70 text-gray-500 hover:border-brand-primary/30 hover:bg-white hover:text-brand-black",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="col-span-2">
          <span className="text-xs font-medium text-brand-black">{t("create.fields.visitPriority")}</span>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {priorityOptions.map((option) => {
              const isActive = priority === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setValue("priority", option.value, { shouldDirty: true })}
                  className={cn(
                    "h-9 rounded-lg border px-3 text-xs font-medium transition-colors",
                    isActive
                      ? option.value === VISIT_PRIORITY.EMERGENCY
                        ? "border-red-500 bg-red-50 text-red-600"
                        : "border-brand-primary bg-brand-primary/10 text-brand-primary"
                      : "border-gray-100 bg-gray-50/70 text-gray-500 hover:border-brand-primary/30 hover:bg-white hover:text-brand-black",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
