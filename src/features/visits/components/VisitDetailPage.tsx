"use client";

import { useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { getActiveProfile } from "@/features/auth/lib/current-user";
import {
  isClinical,
  showsBranchAggregate,
} from "@/features/auth/lib/permissions";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/error";
import { useUpdateVisitStatus } from "../hooks/useUpdateVisitStatus";
import { useVisit } from "../hooks/useVisit";
import { CompleteVisitDialog } from "./CompleteVisitDialog";
import {
  VisitPriorityBadge,
  VisitStatusBadge,
  VisitTypeBadge,
} from "./VisitBadges";

type Props = {
  visitId: string;
};

const TERMINAL_STATUSES = new Set(["COMPLETED", "CANCELLED", "NO_SHOW"]);

function formatDateTime(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

export function VisitDetailPage({ visitId }: Props) {
  const t = useTranslations("visits.detail");
  const { data: user } = useCurrentUser();
  const profile = getActiveProfile(user);
  const branchId = useAuthContextStore((s) => s.branchId);
  const organizationId = useAuthContextStore((s) => s.organizationId);

  const { data: visit, isLoading, isError } = useVisit(visitId);
  const updateStatus = useUpdateVisitStatus();
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);

  const canComplete = isClinical(profile) && visit?.status === "IN_PROGRESS";
  const canCancel =
    visit &&
    showsBranchAggregate(profile) &&
    !TERMINAL_STATUSES.has(visit.status);

  async function handleComplete() {
    if (!visit) return;
    if (!visit.chiefComplaint?.trim()) {
      setCompleteDialogOpen(true);
      return;
    }
    try {
      await updateStatus.mutateAsync({
        visitId: visit.id,
        status: "COMPLETED",
        branchId: visit.branchId,
      });
      toast.success(t("completedToast"));
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("actionError")));
    }
  }

  async function handleCancel() {
    if (!visit) return;
    try {
      await updateStatus.mutateAsync({
        visitId: visit.id,
        status: "CANCELLED",
        branchId: visit.branchId,
      });
      toast.success(t("cancelledToast"));
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("actionError")));
    }
  }

  const backHref = `/${organizationId}/${branchId}/dashboard/visits` as const;

  if (isLoading) {
    return (
      <main className="space-y-6 p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-100" />
        <div className="h-64 animate-pulse rounded-2xl bg-gray-50" />
      </main>
    );
  }

  if (isError || !visit) {
    return (
      <main className="space-y-4 p-6">
        <Link
          href={backHref as Parameters<typeof Link>[0]["href"]}
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-brand-black"
        >
          <ArrowLeft className="size-3.5 rtl:rotate-180" aria-hidden="true" />
          {t("back")}
        </Link>
        <p className="rounded-xl border border-red-100 bg-red-50/50 px-4 py-3 text-xs text-red-600">
          {t("loadError")}
        </p>
      </main>
    );
  }

  return (
    <main className="space-y-6 p-6">
      <div>
        <Link
          href={backHref as Parameters<typeof Link>[0]["href"]}
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-brand-black"
        >
          <ArrowLeft className="size-3.5 rtl:rotate-180" aria-hidden="true" />
          {t("back")}
        </Link>
        <header className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-brand-black">
              {visit.patient.fullName || t("unknownPatient")}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <VisitStatusBadge status={visit.status} />
              <VisitTypeBadge type={visit.type} />
              <VisitPriorityBadge priority={visit.priority} />
              {visit.queueNumber != null && (
                <span className="text-xs text-gray-500 tabular-nums">
                  #{visit.queueNumber}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canCancel && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={updateStatus.isPending}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-full border border-red-200 bg-white px-3 text-xs font-semibold text-red-600",
                  "hover:bg-red-50 disabled:opacity-60",
                )}
              >
                <XCircle className="size-3.5" aria-hidden="true" />
                {t("cancelVisit")}
              </button>
            )}
            {canComplete && (
              <button
                type="button"
                onClick={handleComplete}
                disabled={updateStatus.isPending}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-primary px-3 text-xs font-semibold text-white",
                  "hover:bg-brand-primary/90 disabled:opacity-60",
                )}
              >
                {updateStatus.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="size-3.5" aria-hidden="true" />
                )}
                {t("complete")}
              </button>
            )}
          </div>
        </header>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-brand-black">
            {t("timeline")}
          </h2>
          <dl className="grid grid-cols-1 gap-y-3 sm:grid-cols-2">
            <Field label={t("scheduledAt")} value={formatDateTime(visit.scheduledAt)} />
            <Field label={t("startedAt")} value={formatDateTime(visit.startedAt)} />
            <Field label={t("completedAt")} value={formatDateTime(visit.completedAt)} />
            <Field label={t("createdAt")} value={formatDateTime(visit.createdAt)} />
          </dl>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-brand-black">
            {t("doctor")}
          </h2>
          <p className="text-sm text-brand-black">
            {visit.assignedDoctorName ?? t("unassigned")}
          </p>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm lg:col-span-3">
          <h2 className="mb-2 text-sm font-semibold text-brand-black">
            {t("chiefComplaint")}
          </h2>
          <p className="whitespace-pre-wrap text-sm text-gray-600">
            {visit.chiefComplaint?.trim()
              ? visit.chiefComplaint
              : visit.notes?.trim() ?? t("noChiefComplaint")}
          </p>
          {visit.chiefComplaintMeta?.categories?.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {visit.chiefComplaintMeta.categories.map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-600"
                >
                  {c}
                </span>
              ))}
            </div>
          ) : null}
        </section>

        {visit.vitals ? (
          <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm lg:col-span-3">
            <h2 className="mb-3 text-sm font-semibold text-brand-black">
              {t("vitals")}
            </h2>
            <dl className="grid grid-cols-2 gap-y-3 sm:grid-cols-4">
              <Field
                label={t("vitalsBp")}
                value={
                  visit.vitals.systolic_bp != null && visit.vitals.diastolic_bp != null
                    ? `${visit.vitals.systolic_bp}/${visit.vitals.diastolic_bp} mmHg`
                    : "—"
                }
              />
              <Field
                label={t("vitalsPulse")}
                value={visit.vitals.pulse != null ? `${visit.vitals.pulse} bpm` : "—"}
              />
              <Field
                label={t("vitalsTemperature")}
                value={
                  visit.vitals.temperature_c != null
                    ? `${visit.vitals.temperature_c} °C`
                    : "—"
                }
              />
              <Field
                label={t("vitalsSpo2")}
                value={visit.vitals.spo2 != null ? `${visit.vitals.spo2} %` : "—"}
              />
              <Field
                label={t("vitalsRespiratoryRate")}
                value={
                  visit.vitals.respiratory_rate != null
                    ? `${visit.vitals.respiratory_rate} rpm`
                    : "—"
                }
              />
              <Field
                label={t("vitalsWeight")}
                value={visit.vitals.weight_kg != null ? `${visit.vitals.weight_kg} kg` : "—"}
              />
              <Field
                label={t("vitalsHeight")}
                value={visit.vitals.height_cm != null ? `${visit.vitals.height_cm} cm` : "—"}
              />
              <Field
                label={t("vitalsBmi")}
                value={visit.vitals.bmi != null ? String(visit.vitals.bmi) : "—"}
              />
            </dl>
          </section>
        ) : null}
      </div>

      <CompleteVisitDialog
        open={completeDialogOpen}
        onOpenChange={setCompleteDialogOpen}
        visit={visit}
        onCompleted={() => toast.success(t("completedToast"))}
      />
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-gray-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-brand-black tabular-nums">{value}</dd>
    </div>
  );
}
