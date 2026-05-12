"use client";

import { useTranslations } from "next-intl";
import {
  type Control,
  type FieldErrors,
  useWatch,
  type UseFormRegister,
} from "react-hook-form";
import {
  STAFF_INVITE_DAY_LABELS,
  type StaffCreateDirectFormValues,
  type StaffInviteFormValues,
} from "../lib/staff-invite.schemas";

type AnyFormValues = StaffInviteFormValues | StaffCreateDirectFormValues;

type ShiftSectionError = {
  message?: string;
  root?: { message?: string };
};

function getShiftSectionError(errors: FieldErrors<AnyFormValues>) {
  const shiftErrors = errors.shifts as
    | (typeof errors.shifts & ShiftSectionError)
    | undefined;
  return shiftErrors?.root?.message ?? shiftErrors?.message;
}

const fieldClass =
  "h-9 w-full border-0 border-b border-gray-200 bg-transparent px-0 text-xs text-brand-black outline-none transition-colors placeholder:text-gray-300 focus:border-brand-primary focus:ring-0";

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4">
      <p className="shrink-0 text-xs font-medium text-gray-400">{title}</p>
      <span className="h-px flex-1 bg-gray-300" />
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="pt-1 text-[11px] text-red-500">{message}</p>;
}

export type ScheduleShiftsSectionProps = {
  control: Control<AnyFormValues>;
  errors: FieldErrors<AnyFormValues>;
  isDirectMode: boolean;
  register: UseFormRegister<AnyFormValues>;
};

export default function ScheduleShiftsSection({
  control,
  errors,
  isDirectMode,
  register,
}: ScheduleShiftsSectionProps) {
  const t = useTranslations("staff.create");
  const shifts = useWatch({ control, name: "shifts" });
  const shiftSectionError = getShiftSectionError(errors);

  return (
    <section className="space-y-3">
      <SectionTitle title={t("workingInformation")} />
      {isDirectMode && (
        <p className="text-xs text-gray-400">{t("scheduleOptional")}</p>
      )}
      <div className="space-y-2">
        {(shifts ?? []).map((shift, index) => (
          <div
            key={shift.day}
            className="grid grid-cols-[5.5rem_minmax(0,1fr)_minmax(0,1fr)] items-start gap-3"
          >
            <label className="flex h-9 items-center gap-2">
              <input
                {...register(`shifts.${index}.enabled` as never)}
                type="checkbox"
                className="size-4 rounded border-gray-300 accent-brand-primary"
              />
              <span className="text-xs font-medium text-brand-black">
                {STAFF_INVITE_DAY_LABELS[shift.day]}
              </span>
            </label>
            <label>
              <span className="sr-only">
                {t("startTime", { day: STAFF_INVITE_DAY_LABELS[shift.day] })}
              </span>
              <input
                {...register(`shifts.${index}.startTime` as never)}
                type="time"
                className={fieldClass}
                disabled={!shift.enabled}
              />
              <FieldError
                message={errors.shifts?.[index]?.startTime?.message}
              />
            </label>
            <label>
              <span className="sr-only">
                {t("endTime", { day: STAFF_INVITE_DAY_LABELS[shift.day] })}
              </span>
              <input
                {...register(`shifts.${index}.endTime` as never)}
                type="time"
                className={fieldClass}
                disabled={!shift.enabled}
              />
              <FieldError message={errors.shifts?.[index]?.endTime?.message} />
            </label>
          </div>
        ))}
        <FieldError message={shiftSectionError} />
      </div>
    </section>
  );
}
