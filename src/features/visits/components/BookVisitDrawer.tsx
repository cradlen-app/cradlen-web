"use client";

import { useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import { Dialog } from "radix-ui";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { cn } from "@/common/utils/utils";
import { useFormTemplate } from "@/builder/templates/useFormTemplate";
import {
  TemplateExecutionContextProvider,
  useTemplateExecution,
} from "@/builder/runtime/TemplateExecutionContext";
import { TemplateRenderer } from "@/builder/renderer/TemplateRenderer";
import { buildInitialValues } from "@/builder/templates/initial-values-builder";
import { validateTemplate } from "@/builder/validator/client-validator";
import type { FormTemplateDto } from "@/builder/templates/template.types";
import { useVisitCharges } from "@/core/financial/api";
import { useOrgSpecialties } from "@/features/settings/hooks/useOrgSpecialties";
import { usePatient } from "@/features/patients/hooks/usePatient";
import { useSubmitVisit } from "../hooks/useSubmitVisit";
import { mapVisitApiError } from "../lib/mapVisitApiError";
import type { Visit } from "../types/visits.types";

const TEMPLATE_CODE = "book_visit";

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
  organizationId,
  branchName,
  editingVisit,
}: Props) {
  const t = useTranslations("visits");
  const { data: orgSpecialties, isLoading: specialtiesLoading } = useOrgSpecialties(organizationId);
  const templateExtension = orgSpecialties?.[0]?.code ?? null;
  const {
    data: template,
    isLoading,
    isError,
  } = useFormTemplate(TEMPLATE_CODE, open && !!templateExtension, templateExtension);

  const isEdit = !!editingVisit;
  const patientId =
    isEdit && editingVisit?.kind !== "medical_rep"
      ? editingVisit?.patient.id
      : undefined;
  const { data: patientResp, isLoading: patientLoading } = usePatient(patientId);
  const fullPatient = patientResp?.data;

  // The booked service isn't stored on the visit row — it lives on the booking
  // charge (visit_id → service_id). Read it for patient edits so the Service
  // field prefills like the other fields.
  const isPatientEdit = isEdit && editingVisit?.kind !== "medical_rep";
  const { charges: visitCharges, isLoading: chargesLoading } = useVisitCharges(
    isPatientEdit ? editingVisit?.id : undefined,
  );
  const bookingServiceId = useMemo(() => {
    // Earliest service-bearing charge still eligible to be re-billed = the one
    // captured at booking.
    const eligible = visitCharges
      .filter(
        (c) =>
          c.service_id &&
          (c.status === "PENDING" || c.status === "INVOICED"),
      )
      .sort((a, b) => a.captured_at.localeCompare(b.captured_at));
    return eligible[0]?.service_id ?? undefined;
  }, [visitCharges]);

  const filteredTemplate = useMemo(
    () => (isEdit && template ? stripDiscriminatorSections(template) : template),
    [template, isEdit],
  );

  const initial = useMemo(() => {
    if (!isEdit || !editingVisit || !template) return undefined;
    // For patient visits we wait for the full patient fetch (identity fields)
    // and the booking-charge fetch (Service field) before building, so both
    // prefill on first mount. Medical-rep has everything on the visit row.
    if (editingVisit.kind !== "medical_rep" && (!fullPatient || chargesLoading))
      return undefined;
    const built = buildInitialValues(
      template,
      editingVisit,
      fullPatient,
      editingVisit.specialtyCode ?? templateExtension ?? "",
    );
    // Inject the booked service (field code `service_id`) — the dynamic Service
    // select resolves its label once the catalog options load.
    if (bookingServiceId) {
      built.formValues = { ...built.formValues, service_id: bookingServiceId };
    }
    return built;
  }, [
    isEdit,
    editingVisit,
    template,
    fullPatient,
    templateExtension,
    chargesLoading,
    bookingServiceId,
  ]);

  const waitingForPrefill = isEdit && !initial;
  const loading = isLoading || specialtiesLoading || (isEdit && patientLoading);
  const noSpecialties = !specialtiesLoading && (!orgSpecialties || orgSpecialties.length === 0);

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
          ) : noSpecialties ? (
            <div className="flex flex-1 items-center justify-center text-xs text-red-500">
              {t("create.errorNoSpecialty")}
            </div>
          ) : isError || !filteredTemplate ? (
            <div className="flex flex-1 items-center justify-center text-xs text-red-500">
              {t("create.errorGeneric")}
            </div>
          ) : (
            <TemplateExecutionContextProvider
              template={filteredTemplate}
              initialSystemValues={
                initial?.systemValues ?? {
                  visitor_type: "PATIENT",
                  specialty_code: templateExtension ?? "",
                }
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
  const tValidation = useTranslations("builder.validation");
  const { state } = useTemplateExecution();
  const { submit, isPending: submitPending } = useSubmitVisit();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = !!editingVisit;
  const isMedicalRep = state.systemValues.visitor_type === "MEDICAL_REP";

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
    const clientErrors = validateTemplate(template, snapshot, (key, params) =>
      tValidation(key, params),
    );
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    try {
      await submit({
        template,
        snapshot,
        editingVisit,
        isMedicalRep,
        branchId,
      });
      toast.success(
        isEdit ? t("editVisit.savedToast") : t("create.successMessage"),
      );
      // Medical-rep bookings intentionally do NOT auto-open the visit workspace:
      // reception books, the visit stays SCHEDULED, and the doctor opens/conducts
      // it later (the workspace is doctor-only). Just confirm and close the drawer.
      onClose();
    } catch (error) {
      const mapped = mapVisitApiError(error, template);
      if (mapped.kind === "fields") {
        setErrors(mapped.fieldErrors);
        return;
      }
      if (mapped.kind === "toastKey") {
        toast.error(
          mapped.key === "errorPatientHasOpenVisit"
            ? t("create.errorPatientHasOpenVisit")
            : t("create.errorGeneric"),
        );
        return;
      }
      toast.error(mapped.message);
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