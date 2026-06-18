"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Dialog } from "radix-ui";
import { toast } from "sonner";
import { cn } from "@/common/utils/utils";
import { getApiErrorMessage } from "@/common/errors/error";
import { resolveSpecialtyExamination } from "@/features/examination/lib/specialty-resolver";
import {
  usePatchVisitExamination,
  useVisitExamination,
} from "@/features/examination/api/useVisitExamination";
import { useUpdateVisit } from "../hooks/useUpdateVisit";
import { useUpdateVisitStatus } from "../hooks/useUpdateVisitStatus";
import { CHIEF_COMPLAINT_MAX } from "../lib/visits.constants";
import type { Visit } from "../types/visits.types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visit: Visit | null;
  onCompleted?: () => void;
};

export function CompleteVisitDialog(props: Props) {
  return (
    <Dialog.Root open={props.open} onOpenChange={props.onOpenChange}>
      {props.open && props.visit ? <DialogBody {...props} /> : null}
    </Dialog.Root>
  );
}

function DialogBody({ visit, onOpenChange, onCompleted }: Props) {
  const t = useTranslations("visits.actions.completeRequiresChiefComplaint");

  // Both the main complaint and the provisional diagnosis live on the encounter
  // and are written via the examination PATCH (If-Match the examination_version).
  const config = useMemo(
    () =>
      resolveSpecialtyExamination(
        visit?.subspecialtyCode ?? null,
        visit?.specialtyCode ?? null,
        visit?.id ?? "",
      ),
    [visit?.subspecialtyCode, visit?.specialtyCode, visit?.id],
  );

  const examQuery = useVisitExamination(config?.endpointPath ?? null);
  const patchExam = usePatchVisitExamination(config?.endpointPath ?? "");
  const updateVisit = useUpdateVisit();
  const updateStatus = useUpdateVisitStatus();

  const envelope = examQuery.data ?? null;
  const loading = !!config && examQuery.isLoading;

  // `null` = not yet edited → fall back to the loaded envelope value.
  const [complaint, setComplaint] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const complaintValue =
    complaint ??
    ((envelope?.chief_complaint as string | null) ?? visit?.chiefComplaint ?? "");
  const diagnosisValue =
    diagnosis ?? ((envelope?.provisional_diagnosis as string | null) ?? "");

  const submitting =
    patchExam.isPending || updateVisit.isPending || updateStatus.isPending;

  async function handleSubmit() {
    if (!visit) return;
    const trimmedComplaint = complaintValue.trim();
    if (!trimmedComplaint) {
      setError(t("required"));
      return;
    }
    if (trimmedComplaint.length > CHIEF_COMPLAINT_MAX) {
      setError(t("tooLong"));
      return;
    }
    const trimmedDiagnosis = diagnosisValue.trim();
    if (config && !trimmedDiagnosis) {
      setError(t("diagnosisRequired"));
      return;
    }
    setError(null);

    try {
      if (config && envelope) {
        await patchExam.mutateAsync({
          body: {
            chief_complaint: trimmedComplaint,
            provisional_diagnosis: trimmedDiagnosis,
          },
        });
      } else {
        // Fallback when there's no examination surface (non-OB/GYN): persist the
        // complaint via intake. The backend still gates the diagnosis on close.
        await updateVisit.mutateAsync({
          visitId: visit.id,
          body: { chief_complaint: trimmedComplaint },
          branchId: visit.branchId,
        });
      }
      await updateStatus.mutateAsync({
        visitId: visit.id,
        status: "COMPLETED",
        branchId: visit.branchId,
      });
      toast.success(t("successToast"));
      onOpenChange(false);
      onCompleted?.();
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("genericError")));
    }
  }

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-2xl outline-none">
        <Dialog.Title className="text-base font-semibold text-brand-black">
          {t("title")}
        </Dialog.Title>
        <Dialog.Description className="mt-1 text-xs text-gray-500">
          {t("description")}
        </Dialog.Description>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-xs text-gray-400">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            {t("loading")}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="text-xs font-medium text-brand-black">
                {t("label")}
              </span>
              <textarea
                value={complaintValue}
                onChange={(e) => setComplaint(e.target.value)}
                rows={3}
                maxLength={CHIEF_COMPLAINT_MAX}
                placeholder={t("placeholder")}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-brand-black outline-none focus:border-brand-primary/40 focus:ring-2 focus:ring-brand-primary/20"
              />
              <div className="flex items-center justify-end pt-1">
                <span className="text-[11px] text-gray-400 tabular-nums">
                  {complaintValue.length}/{CHIEF_COMPLAINT_MAX}
                </span>
              </div>
            </label>

            {config && (
              <label className="block">
                <span className="text-xs font-medium text-brand-black">
                  {t("diagnosisLabel")}
                </span>
                <textarea
                  value={diagnosisValue}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  rows={2}
                  placeholder={t("diagnosisPlaceholder")}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-brand-black outline-none focus:border-brand-primary/40 focus:ring-2 focus:ring-brand-primary/20"
                />
              </label>
            )}

            {error ? (
              <p className="text-[11px] text-red-500">{error}</p>
            ) : null}
          </div>
        )}

        <div className="mt-5 flex items-center justify-end gap-2">
          <Dialog.Close className="inline-flex h-9 items-center rounded-full border border-gray-200 px-4 text-xs font-medium text-gray-600 hover:bg-gray-50">
            {t("cancel")}
          </Dialog.Close>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || loading}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-primary px-5 text-xs font-semibold text-white transition-colors hover:bg-brand-primary/90",
              "disabled:bg-brand-primary/50",
            )}
          >
            {submitting && (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            )}
            {t("submit")}
          </button>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
