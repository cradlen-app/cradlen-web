"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Loader2,
  Stethoscope,
  UserPlus,
  UserSearch,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Dialog } from "radix-ui";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { useStaff } from "@/features/staff/hooks/useStaff";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useCreateVisit } from "../hooks/useCreateVisit";
import {
  createVisitSchema,
  getDefaultCreateVisitValues,
  type CreateVisitFormValues,
} from "../lib/visits.schemas";
import type {
  ApiVisitPriority,
  ApiVisitType,
  CreateVisitRequest,
} from "../types/visits.api.types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string | null | undefined;
  organizationId: string | null | undefined;
  branchName?: string;
};

const fieldClass =
  "h-9 w-full border-0 border-b border-gray-200 bg-transparent px-0 text-xs text-brand-black outline-none transition-colors placeholder:text-gray-300 focus:border-brand-primary focus:ring-0";

const TYPE_OPTIONS: Array<{ value: ApiVisitType; key: string }> = [
  { value: "visit", key: "visit" },
  { value: "follow_up", key: "followUp" },
  { value: "medical_rep", key: "medicalRep" },
];

const PRIORITY_OPTIONS: Array<{ value: ApiVisitPriority; key: string }> = [
  { value: "normal", key: "normal" },
  { value: "emergency", key: "emergency" },
];

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4">
      <p className="shrink-0 text-xs font-medium text-gray-400">{title}</p>
      <span className="h-px flex-1 bg-gray-200" />
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="pt-1 text-[11px] text-red-500">{message}</p>;
}

export function NewVisitDrawer({
  open,
  onOpenChange,
  branchId,
  organizationId,
  branchName,
}: Props) {
  const t = useTranslations("visits.create");
  const tType = useTranslations("visits.type");
  const tPriority = useTranslations("visits.priority");
  const createVisit = useCreateVisit();
  const { data: staff = [] } = useStaff(organizationId ?? undefined, branchId ?? undefined);

  const doctors = staff.filter((m) => m.role === "doctor");

  const form = useForm<CreateVisitFormValues>({
    defaultValues: getDefaultCreateVisitValues(),
    resolver: zodResolver(createVisitSchema),
    mode: "onSubmit",
  });

  const {
    formState: { errors },
    handleSubmit,
    register,
    setValue,
    control,
    reset,
  } = form;

  const patientMode = useWatch({ control, name: "patientMode" });
  const type = useWatch({ control, name: "type" });
  const priority = useWatch({ control, name: "priority" });

  useEffect(() => {
    if (open) reset(getDefaultCreateVisitValues());
  }, [open, reset]);

  const onSubmit = handleSubmit(async (values) => {
    if (!branchId) {
      toast.error(t("missingBranch"));
      return;
    }

    const body: CreateVisitRequest = {
      type: values.type,
      priority: values.priority,
      assigned_doctor_id: values.assignedDoctorId || undefined,
      complaint: values.complaint?.trim() || undefined,
      scheduled_at: values.scheduledAt?.trim() || undefined,
      ...(values.patientMode === "existing"
        ? { patient_id: values.patientId }
        : {
            new_patient: {
              first_name: values.newPatient!.firstName.trim(),
              last_name: values.newPatient!.lastName.trim(),
              phone: values.newPatient!.phone.trim() || undefined,
              code: values.newPatient!.code?.trim() || undefined,
            },
          }),
    };

    try {
      await createVisit.mutateAsync({ branchId, body });
      toast.success(t("success"));
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.messages[0] : t("error");
      toast.error(message);
    }
  });

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/35" />
        <Dialog.Content
          className={cn(
            "fixed inset-0 z-50 flex h-dvh w-full flex-col bg-white px-5 py-5 shadow-2xl outline-none",
            "sm:inset-y-0 sm:start-auto sm:inset-e-0 sm:w-107.5 sm:max-w-[calc(100vw-2rem)]",
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
              {branchName && (
                <p className="text-[11px] text-gray-400">
                  {t("branchLabel", { branch: branchName })}
                </p>
              )}

              {/* Patient section */}
              <section className="space-y-3">
                <SectionTitle title={t("patientSection")} />

                <div className="grid grid-cols-2 gap-2">
                  {(["new", "existing"] as const).map((mode) => {
                    const Icon = mode === "new" ? UserPlus : UserSearch;
                    const isActive = patientMode === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() =>
                          setValue("patientMode", mode, {
                            shouldDirty: true,
                            shouldValidate: false,
                          })
                        }
                        className={cn(
                          "flex h-12 items-center gap-2 rounded-lg border px-3 text-start transition-all",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/20",
                          isActive
                            ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                            : "border-gray-100 bg-gray-50/70 text-gray-500 hover:border-brand-primary/30 hover:bg-white hover:text-brand-black",
                        )}
                      >
                        <span
                          className={cn(
                            "inline-flex size-7 shrink-0 items-center justify-center rounded-full",
                            isActive
                              ? "bg-brand-primary text-white"
                              : "bg-white text-gray-400",
                          )}
                        >
                          <Icon className="size-3.5" aria-hidden="true" />
                        </span>
                        <span className="text-xs font-semibold">
                          {t(mode === "new" ? "newPatient" : "existingPatient")}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {patientMode === "new" ? (
                  <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-xs font-medium text-brand-black">
                        {t("firstName")}
                      </span>
                      <input
                        {...register("newPatient.firstName")}
                        className={fieldClass}
                      />
                      <FieldError
                        message={errors.newPatient?.firstName?.message}
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-brand-black">
                        {t("lastName")}
                      </span>
                      <input
                        {...register("newPatient.lastName")}
                        className={fieldClass}
                      />
                      <FieldError
                        message={errors.newPatient?.lastName?.message}
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-brand-black">
                        {t("phone")}
                      </span>
                      <input
                        {...register("newPatient.phone")}
                        className={fieldClass}
                        type="tel"
                        placeholder="+201001234567"
                      />
                      <FieldError message={errors.newPatient?.phone?.message} />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-brand-black">
                        {t("code")}
                      </span>
                      <input
                        {...register("newPatient.code")}
                        className={fieldClass}
                        placeholder="P-0009"
                      />
                      <FieldError message={errors.newPatient?.code?.message} />
                    </label>
                  </div>
                ) : (
                  <label className="block">
                    <span className="text-xs font-medium text-brand-black">
                      {t("patientId")}
                    </span>
                    <input
                      {...register("patientId")}
                      className={fieldClass}
                      placeholder={t("patientIdPlaceholder")}
                    />
                    <FieldError message={errors.patientId?.message} />
                  </label>
                )}
              </section>

              {/* Visit details section */}
              <section className="space-y-3">
                <SectionTitle title={t("detailsSection")} />

                <div>
                  <span className="text-xs font-medium text-brand-black">
                    {t("type")}
                  </span>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {TYPE_OPTIONS.map((option) => {
                      const isActive = type === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          aria-pressed={isActive}
                          onClick={() =>
                            setValue("type", option.value, {
                              shouldDirty: true,
                              shouldValidate: false,
                            })
                          }
                          className={cn(
                            "h-9 rounded-lg border px-2 text-xs font-medium transition-colors",
                            isActive
                              ? "border-brand-primary bg-brand-primary text-white"
                              : "border-gray-100 bg-gray-50/70 text-gray-500 hover:border-brand-primary/30 hover:bg-white hover:text-brand-black",
                          )}
                        >
                          {tType(option.key)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-medium text-brand-black">
                    {t("priority")}
                  </span>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {PRIORITY_OPTIONS.map((option) => {
                      const isActive = priority === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          aria-pressed={isActive}
                          onClick={() =>
                            setValue("priority", option.value, {
                              shouldDirty: true,
                              shouldValidate: false,
                            })
                          }
                          className={cn(
                            "h-9 rounded-lg border px-3 text-xs font-medium transition-colors",
                            isActive
                              ? option.value === "emergency"
                                ? "border-red-500 bg-red-50 text-red-600"
                                : "border-brand-primary bg-brand-primary/10 text-brand-primary"
                              : "border-gray-100 bg-gray-50/70 text-gray-500 hover:border-brand-primary/30 hover:bg-white hover:text-brand-black",
                          )}
                        >
                          {tPriority(option.key)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <label className="block">
                  <span className="text-xs font-medium text-brand-black">
                    {t("assignedDoctor")}
                  </span>
                  <div className="relative">
                    <Stethoscope
                      className="pointer-events-none absolute start-0 top-1/2 size-3.5 -translate-y-1/2 text-gray-400"
                      aria-hidden="true"
                    />
                    <select
                      {...register("assignedDoctorId")}
                      className={cn(fieldClass, "ps-5")}
                    >
                      <option value="">{t("noDoctor")}</option>
                      {doctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {`${d.firstName} ${d.lastName}`.trim() || d.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <FieldError message={errors.assignedDoctorId?.message} />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-brand-black">
                    {t("complaint")}
                  </span>
                  <textarea
                    {...register("complaint")}
                    rows={3}
                    className={cn(
                      fieldClass,
                      "h-auto resize-none border-b py-2",
                    )}
                    placeholder={t("complaintPlaceholder")}
                  />
                  <FieldError message={errors.complaint?.message} />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-brand-black">
                    {t("scheduledAt")}
                  </span>
                  <input
                    {...register("scheduledAt")}
                    type="datetime-local"
                    className={fieldClass}
                  />
                  <FieldError message={errors.scheduledAt?.message} />
                </label>
              </section>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
              <Dialog.Close className="inline-flex h-9 items-center rounded-full border border-gray-200 px-4 text-xs font-medium text-gray-600 hover:bg-gray-50">
                {t("close")}
              </Dialog.Close>
              <button
                type="submit"
                disabled={createVisit.isPending}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-primary px-4 text-xs font-semibold text-white transition-colors hover:bg-brand-primary/90",
                  "disabled:bg-brand-primary/50",
                )}
              >
                {createVisit.isPending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                    {t("submitting")}
                  </>
                ) : (
                  <>
                    <AlertCircle className="hidden" aria-hidden="true" />
                    {t("submit")}
                  </>
                )}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
