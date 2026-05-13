"use client";

import { useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import { Dialog } from "radix-ui";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { cn } from "@/common/utils/utils";
import { ApiError } from "@/infrastructure/http/api";
import { useFormTemplate } from "@/builder/templates/useFormTemplate";
import {
  TemplateExecutionContextProvider,
  useTemplateExecution,
} from "@/builder/runtime/TemplateExecutionContext";
import { TemplateRenderer } from "@/builder/renderer/TemplateRenderer";
import { buildSubmission } from "@/builder/templates/submission-builder";
import { buildInitialValues } from "@/builder/templates/initial-values-builder";
import {
  mapServerFieldErrors,
  validateTemplate,
} from "@/builder/validator/client-validator";
import type { FormTemplateDto } from "@/builder/templates/template.types";
import { usePatient } from "@/features/patients/hooks/usePatient";
import { useBookVisit } from "../hooks/useBookVisit";
import { useBookMedicalRepVisit } from "../hooks/useBookMedicalRepVisit";
import { useUpdateVisit, type UpdateVisitRequest } from "../hooks/useUpdateVisit";
import { useUpdateMedRepVisit } from "../hooks/useUpdateMedRepVisit";
import type {
  BookMedicalRepVisitRequest,
  BookVisitRequest,
  UpdateMedicalRepVisitRequest,
} from "../types/visits.api.types";
import type { Visit } from "../types/visits.types";

const TEMPLATE_CODE = "book_visit";
// OBGYN is the only valid extension today; pediatrics ships later. When the FE
// learns the active specialty from auth/branch context, swap this for that.
const TEMPLATE_EXTENSION = "OBGYN";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string | null | undefined;
  organizationId: string | null | undefined;
  branchName?: string;
  /** When set, the drawer enters edit mode: prefills from the visit + PATCHes on submit. */
  editingVisit?: Visit | null;
};

export function BookVisitDrawer({
  open,
  onOpenChange,
  branchId,
  branchName,
  editingVisit,
}: Props) {
  const t = useTranslations("visits");
  const {
    data: template,
    isLoading,
    isError,
  } = useFormTemplate(TEMPLATE_CODE, open, TEMPLATE_EXTENSION);

  const isEdit = !!editingVisit;
  const patientId =
    isEdit && editingVisit?.kind !== "medical_rep"
      ? editingVisit?.patient.id
      : undefined;
  const { data: patientResp, isLoading: patientLoading } = usePatient(patientId);
  const fullPatient = patientResp?.data;

  const filteredTemplate = useMemo(
    () => (isEdit && template ? stripDiscriminatorSections(template) : template),
    [template, isEdit],
  );

  const initial = useMemo(() => {
    if (!isEdit || !editingVisit || !template) return undefined;
    // For patient visits we wait for the full patient fetch so identity +
    // spouse fields can be prefilled. For medical-rep we have everything on
    // the visit row already.
    if (editingVisit.kind !== "medical_rep" && !fullPatient) return undefined;
    return buildInitialValues(template, editingVisit, fullPatient);
  }, [isEdit, editingVisit, template, fullPatient]);

  const waitingForPrefill = isEdit && !initial;
  const loading = isLoading || (isEdit && patientLoading);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/35" />
        <Dialog.Content
          className={cn(
            "fixed inset-0 z-50 flex h-dvh w-full flex-col bg-white px-5 py-5 shadow-2xl outline-none",
            "sm:inset-y-0 sm:start-auto sm:inset-e-0 sm:w-110 sm:max-w-[calc(100vw-2rem)]",
            "sm:ltr:rounded-l-2xl sm:rtl:rounded-r-2xl",
          )}
        >
          <div className="flex items-center justify-between gap-4">
            <Dialog.Title className="text-lg font-medium text-brand-black">
              {isEdit ? t("editVisit.title") : t("create.title")}
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              {isEdit ? t("editVisit.description") : t("create.description")}
            </Dialog.Description>
            <Dialog.Close
              className="inline-flex size-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-brand-black"
              aria-label="Close"
            >
              <X className="size-5" aria-hidden="true" />
            </Dialog.Close>
          </div>

          {loading || waitingForPrefill ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2
                className="size-5 animate-spin text-brand-primary"
                aria-hidden="true"
              />
            </div>
          ) : isError || !filteredTemplate ? (
            <div className="flex flex-1 items-center justify-center text-xs text-red-500">
              {t("create.errorGeneric")}
            </div>
          ) : (
            <TemplateExecutionContextProvider
              template={filteredTemplate}
              initialSystemValues={
                initial?.systemValues ?? { visitor_type: "PATIENT" }
              }
              initialFormValues={initial?.formValues}
              initialSearchState={initial?.searchState}
            >
              <DrawerBody
                template={filteredTemplate}
                branchId={branchId}
                branchName={branchName}
                onClose={() => onOpenChange(false)}
                editingVisit={editingVisit ?? null}
              />
            </TemplateExecutionContextProvider>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function stripDiscriminatorSections(
  template: FormTemplateDto,
): FormTemplateDto {
  return {
    ...template,
    sections: template.sections.filter((section) => {
      const onlyHasDiscriminator =
        section.fields.length > 0 &&
        section.fields.every(
          (f) =>
            f.binding?.namespace === "SYSTEM" &&
            f.config?.logic?.is_discriminator === true,
        );
      return !onlyHasDiscriminator;
    }),
  };
}

interface BodyProps {
  template: FormTemplateDto;
  branchId: string | null | undefined;
  branchName?: string;
  onClose: () => void;
  editingVisit: Visit | null;
}

function DrawerBody({
  template,
  branchId,
  branchName,
  onClose,
  editingVisit,
}: BodyProps) {
  const t = useTranslations("visits");
  const { state } = useTemplateExecution();
  const bookVisit = useBookVisit();
  const bookMedicalRepVisit = useBookMedicalRepVisit();
  const updateVisit = useUpdateVisit();
  const updateMedRepVisit = useUpdateMedRepVisit();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = !!editingVisit;
  const isMedicalRep = state.systemValues.visitor_type === "MEDICAL_REP";

  const submitPending = isEdit
    ? isMedicalRep
      ? updateMedRepVisit.isPending
      : updateVisit.isPending
    : isMedicalRep
      ? bookMedicalRepVisit.isPending
      : bookVisit.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isEdit && !branchId) {
      toast.error(t("create.errorNoBranch"));
      return;
    }
    const snapshot = {
      formValues: state.formValues,
      searchState: state.searchState,
      systemValues: state.systemValues,
    };
    const clientErrors = validateTemplate(template, snapshot);
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    const body = buildSubmission(template, snapshot);

    if (!isEdit) body.branch_id = branchId;

    // Normalize scheduled_at to a full ISO timestamp (the DATETIME input
    // emits `YYYY-MM-DDTHH:mm` from datetime-local).
    if (
      typeof body.scheduled_at === "string" &&
      body.scheduled_at.length === 16
    ) {
      const d = new Date(body.scheduled_at);
      if (!Number.isNaN(d.getTime())) body.scheduled_at = d.toISOString();
    }

    try {
      if (isEdit && editingVisit) {
        // Identity-search hosts (full_name etc.) submit the typed text via
        // their create-namespace binding. The URL identifies the visit; strip
        // any LOOKUP id that might still be present.
        delete body.patient_id;
        delete body.medical_rep_id;

        if (isMedicalRep) {
          await updateMedRepVisit.mutateAsync({
            visitId: editingVisit.id,
            body: body as unknown as UpdateMedicalRepVisitRequest,
          });
        } else {
          await updateVisit.mutateAsync({
            visitId: editingVisit.id,
            body: body as unknown as UpdateVisitRequest,
            branchId: editingVisit.branchId,
          });
        }
        toast.success(t("editVisit.savedToast"));
        onClose();
        return;
      }

      if (isMedicalRep) {
        await bookMedicalRepVisit.mutateAsync(
          body as unknown as BookMedicalRepVisitRequest,
        );
      } else {
        await bookVisit.mutateAsync(body as unknown as BookVisitRequest);
      }
      toast.success(t("create.successMessage"));
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        const apiBody = error.body as
          | {
              error?: {
                message?: string;
                details?: { fields?: Record<string, string[]> };
              };
            }
          | undefined;
        const details = apiBody?.error?.details?.fields;
        if (details) {
          setErrors(mapServerFieldErrors(template, details));
          return;
        }
        toast.error(apiBody?.error?.message ?? t("create.errorGeneric"));
        return;
      }
      toast.error(t("create.errorGeneric"));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pe-1">
        <TemplateRenderer template={template} errors={errors} />
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
        {branchName ? (
          <span className="me-auto text-[11px] text-gray-400">
            {t("create.branchLabel", { branch: branchName })}
          </span>
        ) : null}
        <Dialog.Close className="inline-flex h-9 items-center rounded-full border border-gray-200 px-4 text-xs font-medium text-gray-600 hover:bg-gray-50">
          {isEdit ? t("editVisit.cancel") : t("create.cancelButton")}
        </Dialog.Close>
        <button
          type="submit"
          disabled={submitPending}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-primary px-5 text-xs font-semibold text-white transition-colors hover:bg-brand-primary/90",
            "disabled:bg-brand-primary/50",
          )}
        >
          {submitPending ? (
            <>
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              {isEdit ? t("editVisit.submit") : t("create.submitting")}
            </>
          ) : isEdit ? (
            t("editVisit.submit")
          ) : (
            t("create.submitButton")
          )}
        </button>
      </div>
    </form>
  );
}