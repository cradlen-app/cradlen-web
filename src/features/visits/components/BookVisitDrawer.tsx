"use client";

import { useState } from "react";
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
import {
  mapServerFieldErrors,
  validateTemplate,
} from "@/builder/validator/client-validator";
import type { FormTemplateDto } from "@/builder/templates/template.types";
import { useBookVisit } from "../hooks/useBookVisit";
import { useBookMedicalRepVisit } from "../hooks/useBookMedicalRepVisit";
import type {
  BookMedicalRepVisitRequest,
  BookVisitRequest,
} from "../types/visits.api.types";

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
};

export function BookVisitDrawer({
  open,
  onOpenChange,
  branchId,
  branchName,
}: Props) {
  const t = useTranslations("visits");
  const {
    data: template,
    isLoading,
    isError,
  } = useFormTemplate(TEMPLATE_CODE, open, TEMPLATE_EXTENSION);

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
              {t("create.title")}
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              {t("create.description")}
            </Dialog.Description>
            <Dialog.Close
              className="inline-flex size-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-brand-black"
              aria-label="Close"
            >
              <X className="size-5" aria-hidden="true" />
            </Dialog.Close>
          </div>

          {isLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2
                className="size-5 animate-spin text-brand-primary"
                aria-hidden="true"
              />
            </div>
          ) : isError || !template ? (
            <div className="flex flex-1 items-center justify-center text-xs text-red-500">
              {t("create.errorGeneric")}
            </div>
          ) : (
            <TemplateExecutionContextProvider
              template={template}
              initialSystemValues={{ visitor_type: "PATIENT" }}
            >
              <DrawerBody
                template={template}
                branchId={branchId}
                branchName={branchName}
                onClose={() => onOpenChange(false)}
              />
            </TemplateExecutionContextProvider>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

interface BodyProps {
  template: FormTemplateDto;
  branchId: string | null | undefined;
  branchName?: string;
  onClose: () => void;
}

function DrawerBody({ template, branchId, branchName, onClose }: BodyProps) {
  const t = useTranslations("visits");
  const { state } = useTemplateExecution();
  const bookVisit = useBookVisit();
  const bookMedicalRepVisit = useBookMedicalRepVisit();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isMedicalRep = state.systemValues.visitor_type === "MEDICAL_REP";
  const submitPending = isMedicalRep
    ? bookMedicalRepVisit.isPending
    : bookVisit.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!branchId) {
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
    body.branch_id = branchId;

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
          {t("create.cancelButton")}
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
              {t("create.submitting")}
            </>
          ) : (
            t("create.submitButton")
          )}
        </button>
      </div>
    </form>
  );
}
