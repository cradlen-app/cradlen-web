"use client";

import { useEffect, useMemo } from "react";
import { Loader2, X } from "lucide-react";
import { Dialog } from "radix-ui";
import { useForm, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useStaff } from "@/core/staff/api";
import { cn } from "@/common/utils/utils";
import { useUpdateVisit } from "../hooks/useUpdateVisit";
import { useUpdateMedRepVisit } from "../hooks/useUpdateMedRepVisit";
import { VISIT_PRIORITY, VISIT_TYPE } from "../lib/visits.constants";
import type {
  ApiVisitPriority,
  ApiVisitType,
  UpdateMedicalRepVisitRequest,
} from "../types/visits.api.types";
import type { Visit } from "../types/visits.types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visit: Visit | null;
  organizationId: string | null | undefined;
  branchId: string | null | undefined;
};

type FormValues = {
  assignedDoctorId: string;
  visitType: ApiVisitType;
  priority: ApiVisitPriority;
  scheduledAt: string;
  notes: string;
};

function toDatetimeLocal(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const FIELD =
  "mt-1 h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-xs text-brand-black outline-none focus:border-brand-primary/40 focus:ring-2 focus:ring-brand-primary/20";

export function EditVisitDrawer({
  open,
  onOpenChange,
  visit,
  organizationId,
  branchId,
}: Props) {
  const t = useTranslations("visits");
  const updateVisit = useUpdateVisit();
  const updateMedRepVisit = useUpdateMedRepVisit();
  const isMedRep = visit?.kind === "medical_rep";
  const isPending = isMedRep ? updateMedRepVisit.isPending : updateVisit.isPending;

  const { data: staffList = [] } = useStaff(
    organizationId ?? undefined,
    undefined,
    { branchId: branchId ?? undefined },
  );
  const doctors = useMemo(
    () => staffList.filter((member) => member.isClinical),
    [staffList],
  );

  const { register, handleSubmit, reset, control, setValue } = useForm<FormValues>({
    defaultValues: {
      assignedDoctorId: "",
      visitType: VISIT_TYPE.VISIT,
      priority: VISIT_PRIORITY.NORMAL,
      scheduledAt: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (visit && open) {
      reset({
        assignedDoctorId: visit.assignedDoctorId ?? "",
        visitType: visit.type,
        priority: visit.priority,
        scheduledAt: toDatetimeLocal(visit.scheduledAt),
        notes: visit.notes ?? "",
      });
    }
  }, [visit, open, reset]);

  const visitType = useWatch({ control, name: "visitType" });
  const priority = useWatch({ control, name: "priority" });

  async function onSubmit(values: FormValues) {
    if (!visit) return;

    if (isMedRep) {
      const body: UpdateMedicalRepVisitRequest = {};
      if (
        values.assignedDoctorId &&
        values.assignedDoctorId !== visit.assignedDoctorId
      ) {
        body.assigned_doctor_id = values.assignedDoctorId;
      }
      if (values.priority !== visit.priority) body.priority = values.priority;
      if (values.scheduledAt) {
        const iso = new Date(values.scheduledAt).toISOString();
        if (iso !== visit.scheduledAt) body.scheduled_at = iso;
      }
      if ((values.notes ?? "") !== (visit.notes ?? "")) body.notes = values.notes;

      if (Object.keys(body).length === 0) {
        onOpenChange(false);
        return;
      }

      try {
        await updateMedRepVisit.mutateAsync({ visitId: visit.id, body });
        toast.success(t("editVisit.savedToast"));
        onOpenChange(false);
      } catch {
        // toast handled in hook
      }
      return;
    }

    const body: Record<string, string> = {};
    if (values.assignedDoctorId && values.assignedDoctorId !== visit.assignedDoctorId) {
      body.assigned_doctor_id = values.assignedDoctorId;
    }
    if (values.visitType !== visit.type) body.visit_type = values.visitType;
    if (values.priority !== visit.priority) body.priority = values.priority;
    if (values.scheduledAt) {
      const iso = new Date(values.scheduledAt).toISOString();
      if (iso !== visit.scheduledAt) body.scheduled_at = iso;
    }
    if ((values.notes ?? "") !== (visit.notes ?? "")) body.notes = values.notes;

    if (Object.keys(body).length === 0) {
      onOpenChange(false);
      return;
    }

    try {
      await updateVisit.mutateAsync({
        visitId: visit.id,
        body,
        branchId: visit.branchId,
      });
      toast.success(t("editVisit.savedToast"));
      onOpenChange(false);
    } catch {
      // toast handled in hook
    }
  }

  const typeOptions: Array<{ value: ApiVisitType; label: string }> = [
    { value: VISIT_TYPE.VISIT, label: t("type.visit") },
    { value: VISIT_TYPE.FOLLOW_UP, label: t("type.followUp") },
    { value: VISIT_TYPE.MEDICAL_REP, label: t("type.medicalRep") },
  ];

  const priorityOptions: Array<{ value: ApiVisitPriority; label: string }> = [
    { value: VISIT_PRIORITY.NORMAL, label: t("priority.normal") },
    { value: VISIT_PRIORITY.EMERGENCY, label: t("priority.emergency") },
  ];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/35" />
        <Dialog.Content
          className={cn(
            "fixed inset-0 z-50 flex h-dvh w-full flex-col bg-white px-5 py-5 shadow-2xl outline-none",
            "sm:inset-y-0 sm:start-auto sm:inset-e-0 sm:w-107.5",
            "sm:ltr:rounded-l-2xl sm:rtl:rounded-r-2xl",
          )}
        >
          <header className="mb-4 flex items-start justify-between gap-3">
            <div>
              <Dialog.Title className="text-base font-semibold text-brand-black">
                {t("editVisit.title")}
              </Dialog.Title>
              <Dialog.Description className="sr-only">
                {t("editVisit.description")}
              </Dialog.Description>
              {visit?.patient.fullName && (
                <p className="mt-0.5 text-xs text-gray-500">
                  {visit.patient.fullName}
                </p>
              )}
            </div>
            <Dialog.Close className="inline-flex size-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-brand-black">
              <X className="size-4" aria-hidden="true" />
            </Dialog.Close>
          </header>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-1 flex-col gap-4 overflow-y-auto"
          >
            <label className="block">
              <span className="text-xs font-medium text-brand-black">
                {t("create.fields.doctor")}
              </span>
              <select {...register("assignedDoctorId")} className={FIELD}>
                <option value="">{t("create.fields.selectDoctor")}</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {`${d.firstName} ${d.lastName}`.trim() || d.email}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-medium text-brand-black">
                {t("create.fields.scheduledAt")}
              </span>
              <input
                {...register("scheduledAt")}
                type="datetime-local"
                className={FIELD}
              />
            </label>

            {isMedRep ? null : (
              <div>
                <span className="text-xs font-medium text-brand-black">
                  {t("create.fields.visitType")}
                </span>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {typeOptions.map((opt) => {
                    const isActive = visitType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          setValue("visitType", opt.value, { shouldDirty: true })
                        }
                        className={cn(
                          "h-9 rounded-lg border px-2 text-xs font-medium transition-colors",
                          isActive
                            ? "border-brand-primary bg-brand-primary text-white"
                            : "border-gray-100 bg-gray-50/70 text-gray-500 hover:border-brand-primary/30 hover:bg-white hover:text-brand-black",
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <span className="text-xs font-medium text-brand-black">
                {t("create.fields.visitPriority")}
              </span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {priorityOptions.map((opt) => {
                  const isActive = priority === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setValue("priority", opt.value, { shouldDirty: true })
                      }
                      className={cn(
                        "h-9 rounded-lg border px-3 text-xs font-medium transition-colors",
                        isActive
                          ? opt.value === VISIT_PRIORITY.EMERGENCY
                            ? "border-red-500 bg-red-50 text-red-600"
                            : "border-brand-primary bg-brand-primary/10 text-brand-primary"
                          : "border-gray-100 bg-gray-50/70 text-gray-500 hover:border-brand-primary/30 hover:bg-white hover:text-brand-black",
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="block">
              <span className="text-xs font-medium text-brand-black">
                {t("create.fields.notes")}
              </span>
              <textarea
                {...register("notes")}
                rows={4}
                placeholder={t("create.fields.notesPlaceholder")}
                className={cn(FIELD, "h-auto py-2")}
              />
            </label>

            <footer className="mt-auto flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
              <Dialog.Close className="inline-flex h-9 items-center rounded-full border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 hover:bg-gray-50">
                {t("editVisit.cancel")}
              </Dialog.Close>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-primary px-4 text-xs font-semibold text-white hover:bg-brand-primary/90 disabled:opacity-60"
              >
                {isPending && (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                )}
                {t("editVisit.submit")}
              </button>
            </footer>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
