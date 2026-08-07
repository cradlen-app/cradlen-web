"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Dialog } from "radix-ui";
import { toast } from "sonner";
import { cn } from "@/common/utils/utils";
import { useRouter } from "@/i18n/navigation";
import { useProviderServices } from "@/core/financial/api";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { getActiveProfile } from "@/features/auth/lib/current-user";
import { isOwner } from "@/features/auth/lib/permissions";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { capture } from "@/infrastructure/analytics/posthog";
import { useQuickStartVisit } from "../hooks/useQuickStartVisit";
import { mapVisitApiError } from "../lib/mapVisitApiError";
import { buildQuickStartVisitPayload } from "../lib/visit-submission";
import { CHIEF_COMPLAINT_MAX, VISIT_TYPE } from "../lib/visits.constants";
import { visitWorkspacePath } from "../lib/visits.utils";
import type { ApiVisitType } from "../types/visits.api.types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  patientName: string;
};

/**
 * Doctor self-start: create a visit for this patient and walk straight into the
 * consultation, with no receptionist to book and check them in.
 *
 * Deliberately a plain form rather than the `book_visit` builder template. That
 * template is reception-shaped — patient search, new-patient demographics, a
 * doctor picker — and here every one of those is fixed or derived. The doctor
 * *is* the caller, so a doctor picker would be a bug surface (the API 403s on
 * any other value). The server still runs `assertTemplateValid` on whatever we
 * POST, so nothing is enforced any less strictly.
 */
export function QuickStartVisitDialog(props: Props) {
  return (
    <Dialog.Root open={props.open} onOpenChange={props.onOpenChange}>
      {props.open ? <DialogBody {...props} /> : null}
    </Dialog.Root>
  );
}

function DialogBody({ onOpenChange, patientId, patientName }: Props) {
  const t = useTranslations("patients.workspace.startVisitDialog");
  const tCreate = useTranslations("visits.create");
  const router = useRouter();

  const { data: user } = useCurrentUser();
  const profile = getActiveProfile(user);
  const organizationId = useAuthContextStore((s) => s.organizationId);
  const branchId = useAuthContextStore((s) => s.branchId);
  const profileId = useAuthContextStore((s) => s.profileId);

  // The doctor's OWN specialty — see buildQuickStartVisitPayload for why the
  // organization's specialty list is the wrong source here.
  const specialtyCode = profile?.specialty?.code ?? null;

  const { authorizations, isLoading } = useProviderServices(profileId);
  const quickStart = useQuickStartVisit();

  // Mirror the server's `OR: [{ branch_id }, { branch_id: null }]` so the picker
  // can only ever offer a service the booking call will accept.
  const services = useMemo(() => {
    return authorizations
      .filter(
        (a) =>
          a.is_active && (a.branch_id === null || a.branch_id === branchId),
      )
      .sort((a, b) => {
        // Consultations first — the overwhelmingly common walk-in service.
        const aConsult = a.service?.service_type === "CONSULTATION" ? 0 : 1;
        const bConsult = b.service?.service_type === "CONSULTATION" ? 0 : 1;
        if (aConsult !== bConsult) return aConsult - bConsult;
        return (a.service?.name ?? "").localeCompare(b.service?.name ?? "");
      });
  }, [authorizations, branchId]);

  const [serviceId, setServiceId] = useState<string | null>(null);
  const [appointmentType, setAppointmentType] = useState<ApiVisitType>(
    VISIT_TYPE.VISIT,
  );
  const [complaint, setComplaint] = useState("");

  const selectedServiceId = serviceId ?? services[0]?.service_id ?? "";

  const blockedReason = !branchId
    ? t("errorNoBranch")
    : !specialtyCode
      ? t("errorNoSpecialty")
      : !isLoading && services.length === 0
        ? t("noServices")
        : null;

  const canSubmit =
    !blockedReason && !!selectedServiceId && !quickStart.isPending;

  async function handleSubmit() {
    if (!specialtyCode || !profileId || !selectedServiceId) return;

    try {
      const res = await quickStart.mutateAsync(
        buildQuickStartVisitPayload({
          patientId,
          specialtyCode,
          serviceId: selectedServiceId,
          assignedDoctorId: profileId,
          appointmentType,
          branchId,
          chiefComplaint: complaint,
        }),
      );

      const visitId = res.data.visit.id;
      capture("visit_self_started", { visitId });
      toast.success(t("successToast"));
      onOpenChange(false);
      router.push(
        visitWorkspacePath({ id: visitId, kind: "patient" }, organizationId, branchId),
      );
    } catch (error) {
      handleError(error);
    }
  }

  function handleError(error: unknown) {
    const mapped = mapVisitApiError(error);

    if (mapped.kind === "toastKey") {
      if (mapped.key === "errorPatientHasOpenVisit") {
        // Dead end otherwise — the API told us which visit is blocking, so
        // offer to jump straight into it.
        toast.error(t("errorPatientHasOpenVisit"), {
          action: mapped.visitId
            ? {
                label: t("openExistingVisit"),
                onClick: () =>
                  router.push(
                    visitWorkspacePath(
                      { id: mapped.visitId!, kind: "patient" },
                      organizationId,
                      branchId,
                    ),
                  ),
              }
            : undefined,
        });
        return;
      }
      toast.error(t("errorGeneric"));
      return;
    }

    if (mapped.kind === "allowanceExceeded") {
      // The doctor usually can't buy anything; only point an owner at billing.
      const owner = isOwner(profile);
      toast.error(tCreate("errorJourneyAllowance"), {
        description: owner ? undefined : tCreate("errorJourneyAllowanceAskOwner"),
        action: owner
          ? {
              label: tCreate("errorJourneyAllowanceCta"),
              onClick: () =>
                router.push(
                  `/${organizationId}/${branchId}/dashboard/settings/subscription`,
                ),
            }
          : undefined,
      });
      // Deliberately left open: re-submitting won't help, but closing would
      // throw away the complaint they typed.
      return;
    }

    if (mapped.kind === "fields") {
      toast.error(Object.values(mapped.fieldErrors).join(", "));
      return;
    }

    if (mapped.kind === "duplicatePatient") {
      // Unreachable from this dialog (it always books an existing patient by
      // id), but the union is shared — handled so the switch stays exhaustive.
      toast.error(tCreate("errorDuplicatePatient"));
      return;
    }

    toast.error(mapped.message);
  }

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-2xl outline-none">
        <Dialog.Title className="text-base font-semibold text-brand-black">
          {t("title")}
        </Dialog.Title>
        <Dialog.Description className="mt-1 text-xs text-gray-500">
          {t("description", { name: patientName })}
        </Dialog.Description>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-xs text-gray-400">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {blockedReason ? (
              <p className="rounded-xl border border-amber-100 bg-amber-50/50 px-3 py-2 text-[11px] text-amber-700">
                {blockedReason}
              </p>
            ) : (
              <>
                <label className="block">
                  <span className="text-xs font-medium text-brand-black">
                    {t("service")}
                  </span>
                  <select
                    value={selectedServiceId}
                    onChange={(e) => setServiceId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-brand-black outline-none focus:border-brand-primary/40 focus:ring-2 focus:ring-brand-primary/20"
                  >
                    {services.map((a) => (
                      <option key={a.service_id} value={a.service_id}>
                        {a.service?.name ?? a.service?.code ?? a.service_id}
                      </option>
                    ))}
                  </select>
                </label>

                <fieldset className="block">
                  <legend className="text-xs font-medium text-brand-black">
                    {t("appointmentType")}
                  </legend>
                  <div className="mt-1 flex gap-2">
                    {(
                      [
                        [VISIT_TYPE.VISIT, t("typeVisit")],
                        [VISIT_TYPE.FOLLOW_UP, t("typeFollowUp")],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setAppointmentType(value)}
                        aria-pressed={appointmentType === value}
                        className={cn(
                          "h-8 flex-1 rounded-full border text-xs font-medium transition-colors",
                          appointmentType === value
                            ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <label className="block">
                  <span className="text-xs font-medium text-brand-black">
                    {t("complaint")}
                  </span>
                  <textarea
                    value={complaint}
                    onChange={(e) => setComplaint(e.target.value)}
                    rows={3}
                    maxLength={CHIEF_COMPLAINT_MAX}
                    placeholder={t("complaintPlaceholder")}
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-brand-black outline-none focus:border-brand-primary/40 focus:ring-2 focus:ring-brand-primary/20"
                  />
                </label>
              </>
            )}
          </div>
        )}

        <div className="mt-5 flex items-center justify-end gap-2">
          <Dialog.Close className="inline-flex h-9 items-center rounded-full border border-gray-200 px-4 text-xs font-medium text-gray-600 hover:bg-gray-50">
            {t("cancel")}
          </Dialog.Close>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-primary px-5 text-xs font-semibold text-white transition-colors hover:bg-brand-primary/90",
              "disabled:bg-brand-primary/50",
            )}
          >
            {quickStart.isPending && (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            )}
            {quickStart.isPending ? t("submitting") : t("submit")}
          </button>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
