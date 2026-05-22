"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ApiError } from "@/infrastructure/http/api";
import { fetchFormTemplate } from "@/builder/templates/templates.api";
import { queryKeys } from "@/lib/queryKeys";
import { TemplateExecutionContextProvider } from "@/builder/runtime/TemplateExecutionContext";
import { toInitialFormState } from "@/builder/templates/initial-values";
import { resolveSpecialtyExamination } from "@/features/examination/lib/specialty-resolver";
import {
  usePatchVisitExamination,
  useVisitExamination,
  visitExaminationKey,
} from "@/features/examination/api/useVisitExamination";
import { VisitExaminationFormShell } from "@/features/examination/components/VisitExaminationFormShell";

import type { Visit } from "@/features/visits/types/visits.types";

interface Props {
  visit: Visit;
}

function isNotFound(err: unknown): boolean {
  return err instanceof ApiError && err.status === 404;
}

function isStaleVersion(err: unknown): boolean {
  if (!(err instanceof ApiError)) return false;
  if (err.status === 412) return true;
  if (err.status === 409) {
    const body = err.body as { error?: { code?: string } } | undefined;
    return body?.error?.code === "STALE_VERSION";
  }
  return false;
}

export function ExaminationTab({ visit }: Props) {
  const t = useTranslations("examination.workspace");
  const config = useMemo(
    () => resolveSpecialtyExamination(visit.specialtyCode ?? null, visit.id),
    [visit.specialtyCode, visit.id],
  );

  const qc = useQueryClient();

  const templateQuery = useQuery({
    queryKey: config
      ? queryKeys.formTemplates.byCode(config.templateCode, null)
      : (["form-template", "disabled"] as const),
    queryFn: () => fetchFormTemplate(config!.templateCode),
    enabled: !!config,
    staleTime: Infinity,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 404) return false;
      return failureCount < 2;
    },
  });

  const dataQuery = useVisitExamination(config?.endpointPath ?? null);
  const patchMut = usePatchVisitExamination(config?.endpointPath ?? "");

  const rawEnvelope = dataQuery.data ?? null;
  const enrichedEnvelope = useMemo(
    () =>
      rawEnvelope != null &&
      rawEnvelope.case_path == null &&
      visit.carePathCode
        ? { ...rawEnvelope, case_path: visit.carePathCode }
        : rawEnvelope,
    [rawEnvelope, visit.carePathCode],
  );

  if (!config) {
    return (
      <div className="p-6 text-xs text-gray-500">{t("loadError")}</div>
    );
  }
  if (isNotFound(templateQuery.error) || isNotFound(dataQuery.error)) {
    return (
      <div className="p-6 text-xs text-gray-500">{t("loadError")}</div>
    );
  }
  if (templateQuery.isLoading || dataQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-12 text-xs text-gray-400">
        <Loader2 className="mr-2 animate-spin" size={14} />
        {t("loading")}
      </div>
    );
  }
  if (!templateQuery.data || !enrichedEnvelope) {
    return (
      <div className="p-6 text-xs text-red-500">{t("loadError")}</div>
    );
  }

  const template = templateQuery.data;
  const envelope = enrichedEnvelope;
  const initial = toInitialFormState(envelope, template);

  return (
    <TemplateExecutionContextProvider
      key={envelope.examination_version}
      template={template}
      initialFormValues={initial.formValues}
      initialSearchState={initial.searchState}
      initialRepeatableRows={initial.repeatableRows}
    >
      <VisitExaminationFormShell
        template={template}
        patientId={visit.patient.id}
        saving={patchMut.isPending || dataQuery.isFetching}
        onSave={async (body) => {
          try {
            await patchMut.mutateAsync({
              ifMatchVersion: envelope.examination_version,
              body,
            });
            toast.success(t("saved"));
          } catch (err) {
            if (isStaleVersion(err)) {
              toast.warning(t("staleVersion"));
              await qc.invalidateQueries({
                queryKey: visitExaminationKey(config.endpointPath),
              });
              return;
            }
            const message =
              err instanceof Error ? err.message : t("saveError");
            toast.error(message);
            throw err;
          }
        }}
      />
    </TemplateExecutionContextProvider>
  );
}
