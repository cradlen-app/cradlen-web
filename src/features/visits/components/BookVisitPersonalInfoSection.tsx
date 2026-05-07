"use client";

import { useTranslations } from "next-intl";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { cn } from "@/lib/utils";
import { VISIT_TYPE } from "../lib/visits.constants";
import type { BookVisitFormValues } from "../lib/visits.schemas";
import type { ApiVisitType } from "../types/visits.api.types";
import { fieldClass, SectionTitle, FieldError } from "./book-visit-shared";

type Props = {
  register: UseFormRegister<BookVisitFormValues>;
  errors: FieldErrors<BookVisitFormValues>;
  patientMode: "existing" | "new";
  visitType: ApiVisitType;
  isMarried: boolean | undefined;
};

export function BookVisitPersonalInfoSection({
  register,
  errors,
  patientMode,
  visitType,
  isMarried,
}: Props) {
  const t = useTranslations("visits");

  return (
    <section className="space-y-3">
      <SectionTitle title={t("create.sectionPersonalInfo")} />

      <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
        <label className="col-span-2 block">
          <span className="text-xs font-medium text-brand-black">{t("create.fields.name")}</span>
          <input
            {...register("fullName")}
            readOnly={patientMode === "existing"}
            className={cn(fieldClass, patientMode === "existing" && "text-gray-500")}
            placeholder={t("create.fields.namePlaceholder")}
          />
          <FieldError message={errors.fullName?.message} />
        </label>

        <label className="col-span-2 block">
          <span className="text-xs font-medium text-brand-black">{t("create.fields.phone")}</span>
          <input
            {...register("phoneNumber")}
            readOnly={patientMode === "existing"}
            className={cn(fieldClass, patientMode === "existing" && "text-gray-500")}
            type="tel"
            placeholder="01012345678"
          />
          <FieldError message={errors.phoneNumber?.message} />
        </label>

        {visitType === VISIT_TYPE.MEDICAL_REP && (
          <label className="col-span-2 block">
            <span className="text-xs font-medium text-brand-black">{t("create.fields.company")}</span>
            <input
              {...register("company")}
              className={fieldClass}
              placeholder={t("create.fields.companyPlaceholder")}
            />
          </label>
        )}

        {visitType !== VISIT_TYPE.MEDICAL_REP && (
          <>
            <label className="block">
              <span className="text-xs font-medium text-brand-black">{t("create.fields.nationalId")}</span>
              <input
                {...register("nationalId")}
                readOnly={patientMode === "existing"}
                className={cn(fieldClass, patientMode === "existing" && "text-gray-500")}
                placeholder="12345678901234"
              />
              <FieldError message={errors.nationalId?.message} />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-brand-black">{t("create.fields.dateOfBirth")}</span>
              <input
                {...register("dateOfBirth")}
                readOnly={patientMode === "existing"}
                className={cn(fieldClass, patientMode === "existing" && "text-gray-500")}
                type="date"
              />
              <FieldError message={errors.dateOfBirth?.message} />
            </label>

            <label className="col-span-2 block">
              <span className="text-xs font-medium text-brand-black">{t("create.fields.address")}</span>
              <input
                {...register("address")}
                readOnly={patientMode === "existing"}
                className={cn(fieldClass, patientMode === "existing" && "text-gray-500")}
                placeholder={t("create.fields.addressPlaceholder")}
              />
            </label>

            {patientMode !== "existing" && (
              <label className="col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register("isMarried")}
                  className="size-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                />
                <span className="text-xs font-medium text-brand-black">{t("create.fields.married")}</span>
              </label>
            )}

            {isMarried && patientMode !== "existing" && (
              <label className="col-span-2 block">
                <span className="text-xs font-medium text-brand-black">{t("create.fields.husbandName")}</span>
                <input
                  {...register("husbandName")}
                  className={fieldClass}
                  placeholder={t("create.fields.husbandNamePlaceholder")}
                />
                <FieldError message={errors.husbandName?.message} />
              </label>
            )}
          </>
        )}
      </div>
    </section>
  );
}
