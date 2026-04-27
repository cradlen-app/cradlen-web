"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { BriefcaseBusiness, Stethoscope, UserRoundCog, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Dialog } from "radix-ui";
import { type FieldErrors, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useInviteStaff } from "../hooks/useInviteStaff";
import {
  getDefaultStaffInviteValues,
  STAFF_INVITE_DAY_LABELS,
  staffInviteSchema,
  splitStaffName,
  type StaffInviteFormValues,
} from "../lib/staff-invite.schemas";
import type { StaffRoleFilter } from "../types/staff.types";

type StaffCreateDrawerProps = {
  branchId?: string;
  branchName?: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  organizationId?: string;
  organizationName?: string;
  roleFilters: StaffRoleFilter[];
};

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

type ShiftSectionError = {
  message?: string;
  root?: {
    message?: string;
  };
};

function getShiftSectionError(errors: FieldErrors<StaffInviteFormValues>) {
  const shiftErrors = errors.shifts as (typeof errors.shifts & ShiftSectionError) | undefined;

  return shiftErrors?.root?.message ?? shiftErrors?.message;
}

const fieldClass =
  "h-9 w-full border-0 border-b border-gray-200 bg-transparent px-0 text-xs text-brand-black outline-none transition-colors placeholder:text-gray-300 focus:border-brand-primary focus:ring-0";

const roleIcons = {
  doctor: Stethoscope,
  owner: UserRoundCog,
  reception: BriefcaseBusiness,
};

type InviteFieldName =
  | "email"
  | "jobTitle"
  | "name"
  | "phone"
  | "roleId"
  | "shifts"
  | "specialty";

function getInviteErrorField(message: string): InviteFieldName | null {
  const normalized = message.toLowerCase();

  if (normalized.includes("email")) return "email";
  if (normalized.includes("first_name") || normalized.includes("last_name")) return "name";
  if (normalized.includes("role_id")) return "roleId";
  if (normalized.includes("job_title")) return "jobTitle";
  if (normalized.includes("specialty")) return "specialty";
  if (normalized.includes("phone")) return "phone";
  if (normalized.includes("branch") || normalized.includes("schedule") || normalized.includes("shift")) {
    return "shifts";
  }

  return null;
}

export function StaffCreateDrawer({
  branchId,
  branchName,
  onOpenChange,
  open,
  organizationId,
  organizationName,
  roleFilters,
}: StaffCreateDrawerProps) {
  const t = useTranslations("staff.create");
  const inviteStaff = useInviteStaff();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
    control,
  } = useForm<StaffInviteFormValues>({
    defaultValues: getDefaultStaffInviteValues(),
    resolver: zodResolver(staffInviteSchema),
  });

  const selectedRole = useWatch({ control, name: "role" });
  const isClinical = useWatch({ control, name: "isClinical" });
  const shifts = useWatch({ control, name: "shifts" });
  const showOwnerClinical = selectedRole === "owner";
  const showSpecialty =
    selectedRole === "doctor" || (selectedRole === "owner" && isClinical);
  const shiftSectionError = getShiftSectionError(errors);

  useEffect(() => {
    if (!open) {
      reset(getDefaultStaffInviteValues());
    }
  }, [open, reset]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setFormError(null);
    }

    onOpenChange(nextOpen);
  };

  const handleRoleChange = (roleId: string) => {
    const selected = roleFilters.find((role) => role.id === roleId);

    setValue("roleId", roleId, { shouldDirty: true, shouldValidate: true });
    setValue("role", selected?.role ?? "doctor", {
      shouldDirty: true,
      shouldValidate: true,
    });

    if (selected?.role !== "owner") {
      setValue("isClinical", false, { shouldDirty: true, shouldValidate: true });
    }

    if (selected?.role === "reception") {
      setValue("specialty", "", { shouldDirty: true, shouldValidate: true });
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    if (!organizationId || !branchId) {
      toast.error(t("missingOrganization"));
      return;
    }

    const { firstName, lastName } = splitStaffName(values.name);

    try {
      await inviteStaff.mutateAsync({
        organization_id: organizationId,
        branches: [
          {
            branch_id: branchId,
            schedule: {
              days: values.shifts
                .filter((shift) => shift.enabled)
                .map((shift) => ({
                  day_of_week: shift.day,
                  shifts: [
                    {
                      start_time: shift.startTime,
                      end_time: shift.endTime,
                    },
                  ],
                })),
            },
          },
        ],
        role_id: values.roleId,
        first_name: firstName,
        last_name: lastName,
        email: values.email,
        ...(values.phone ? { phone: values.phone } : {}),
        job_title: values.jobTitle,
        ...(showSpecialty && values.specialty ? { specialty: values.specialty } : {}),
      });

      toast.success(t("success"));
      onOpenChange(false);
      reset(getDefaultStaffInviteValues());
    } catch (error) {
      if (error instanceof ApiError) {
        if (
          error.status === 409 ||
          error.messages.some((message) =>
            message.toLowerCase().includes("pending invitation already exists"),
          )
        ) {
          const message = t("errors.pendingInvitation");
          setError("email", { type: "server", message });
          toast.error(message);
          return;
        }

        if (error.status === 400) {
          let didSetFieldError = false;

          error.messages.forEach((message) => {
            const field = getInviteErrorField(message);

            if (!field) return;

            didSetFieldError = true;
            setError(field, { type: "server", message });
          });

          if (didSetFieldError) {
            setFormError(t("errors.reviewFields"));
            toast.error(t("errors.reviewFields"));
            return;
          }
        }

        const message = error.messages[0] || t("error");
        setFormError(message);
        toast.error(message);
        return;
      }

      setFormError(t("error"));
      toast.error(t("error"));
    }
  }, () => {
    setFormError(t("errors.reviewFields"));
    toast.error(t("errors.reviewFields"));
  });

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/35" />
        <Dialog.Content
          className={cn(
            "fixed inset-0 z-50 flex h-dvh w-full flex-col bg-white px-5 py-5 shadow-2xl outline-none",
            "sm:inset-y-0 sm:start-auto sm:end-0 sm:w-[430px] sm:max-w-[calc(100vw-2rem)]",
            "sm:ltr:rounded-l-2xl sm:rtl:rounded-r-2xl",
          )}
        >
          <div className="flex items-center justify-between gap-4">
            <Dialog.Title className="text-lg font-medium text-brand-black">
              {t("title")}
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              {t("description")}
            </Dialog.Description>
            <Dialog.Close
              className="inline-flex size-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-brand-black"
              aria-label={t("close")}
            >
              <X className="size-5" aria-hidden="true" />
            </Dialog.Close>
          </div>

          <form onSubmit={onSubmit} className="mt-6 flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pe-1">
              {formError && (
                <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
                  {formError}
                </div>
              )}

              <section className="space-y-3">
                <SectionTitle title={t("organizationAndBranch")} />
                <div className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-medium text-brand-black">
                      {t("organization")}
                    </span>
                    <input
                      className={cn(fieldClass, "text-gray-500")}
                      readOnly
                      value={organizationName ?? ""}
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-medium text-brand-black">{t("branch")}</span>
                    <input
                      className={cn(fieldClass, "text-gray-500")}
                      readOnly
                      value={branchName ?? ""}
                    />
                  </label>
                </div>
              </section>

              <section className="space-y-3">
                <SectionTitle title={t("account")} />
                <div className="grid grid-cols-1 gap-x-8 gap-y-2">
                  <label className="block">
                    <span className="text-xs font-medium text-brand-black">{t("email")}</span>
                    <input {...register("email")} className={fieldClass} type="email" />
                    <FieldError message={errors.email?.message} />
                  </label>
                </div>
              </section>

              <section className="space-y-3">
                <SectionTitle title={t("personalInformation")} />
                <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-medium text-brand-black">{t("name")}</span>
                    <input {...register("name")} className={fieldClass} />
                    <FieldError message={errors.name?.message} />
                  </label>

                  <label className="block">
                    <span className="text-xs font-medium text-brand-black">{t("jobTitle")}</span>
                    <input {...register("jobTitle")} className={fieldClass} />
                    <FieldError message={errors.jobTitle?.message} />
                  </label>

                  <label className="block">
                    <span className="text-xs font-medium text-brand-black">{t("phone")}</span>
                    <input {...register("phone")} className={fieldClass} type="tel" />
                    <FieldError message={errors.phone?.message} />
                  </label>

                  <div className="sm:col-span-2">
                    <span className="text-xs font-medium text-brand-black">{t("role")}</span>
                    <input {...register("roleId")} type="hidden" />
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {roleFilters.map((role) => {
                        const Icon = roleIcons[role.role];
                        const isSelected = selectedRole === role.role;

                        return (
                          <button
                            key={role.id}
                            type="button"
                            onClick={() => handleRoleChange(role.id)}
                            aria-pressed={isSelected}
                            className={cn(
                              "flex h-14 items-center gap-2 rounded-lg border px-3 text-start transition-all",
                              "focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/20 focus-visible:outline-none",
                              isSelected
                                ? "border-brand-primary bg-brand-primary/8 text-brand-primary shadow-sm"
                                : "border-gray-100 bg-gray-50/70 text-gray-500 hover:border-brand-primary/30 hover:bg-white hover:text-brand-black",
                            )}
                          >
                            <span
                              className={cn(
                                "inline-flex size-8 shrink-0 items-center justify-center rounded-full",
                                isSelected ? "bg-brand-primary text-white" : "bg-white text-gray-400",
                              )}
                            >
                              <Icon className="size-4" aria-hidden="true" />
                            </span>
                            <span className="min-w-0 text-xs font-semibold">
                              {t(`roles.${role.role}`)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <FieldError message={errors.roleId?.message} />
                  </div>

                  {showOwnerClinical && (
                    <label className="flex items-center gap-2 pt-3">
                      <input
                        {...register("isClinical")}
                        type="checkbox"
                        className="size-4 rounded border-gray-300 accent-brand-primary"
                      />
                      <span className="text-xs font-medium text-brand-black">
                        {t("isClinical")}
                      </span>
                    </label>
                  )}

                  {showSpecialty && (
                    <label className="block">
                      <span className="text-xs font-medium text-brand-black">
                        {t("specialty")}
                      </span>
                      <input {...register("specialty")} className={fieldClass} />
                      <FieldError message={errors.specialty?.message} />
                    </label>
                  )}
                </div>
              </section>

              <section className="space-y-3">
                <SectionTitle title={t("workingInformation")} />
                <div className="space-y-2">
                  {shifts.map((shift, index) => (
                    <div
                      key={shift.day}
                      className="grid grid-cols-[5.5rem_minmax(0,1fr)_minmax(0,1fr)] items-start gap-3"
                    >
                      <label className="flex h-9 items-center gap-2">
                        <input
                          {...register(`shifts.${index}.enabled`)}
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
                          {...register(`shifts.${index}.startTime`)}
                          type="time"
                          className={fieldClass}
                          disabled={!shift.enabled}
                        />
                        <FieldError message={errors.shifts?.[index]?.startTime?.message} />
                      </label>
                      <label>
                        <span className="sr-only">
                          {t("endTime", { day: STAFF_INVITE_DAY_LABELS[shift.day] })}
                        </span>
                        <input
                          {...register(`shifts.${index}.endTime`)}
                          type="time"
                          className={fieldClass}
                          disabled={!shift.enabled}
                        />
                        <FieldError message={errors.shifts?.[index]?.endTime?.message} />
                      </label>
                    </div>
                  ))}
                  <FieldError
                    message={shiftSectionError}
                  />
                </div>
              </section>
            </div>

            <div className="flex justify-end border-t border-gray-100 pt-3">
              <button
                type="submit"
                disabled={inviteStaff.isPending}
                className="inline-flex h-8 min-w-20 items-center justify-center rounded-full bg-brand-primary px-5 text-xs font-semibold text-white transition-colors hover:bg-brand-primary/90 disabled:opacity-50"
              >
                {inviteStaff.isPending ? t("inviting") : t("invite")}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
