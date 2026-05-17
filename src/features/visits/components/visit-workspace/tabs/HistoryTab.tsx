"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ApiError } from "@/infrastructure/http/api";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { fetchFormTemplate } from "@/builder/templates/templates.api";
import { queryKeys } from "@/lib/queryKeys";
import { TemplateExecutionContextProvider } from "@/builder/runtime/TemplateExecutionContext";
import { resolveSpecialtyHistory } from "@/features/patient-history/lib/specialty-resolver";
import {
  patientHistoryKey,
  usePatchPatientHistory,
  usePatientHistory,
} from "@/features/patient-history/api/usePatientHistory";
import { useSectionVisibility } from "@/features/patient-history/lib/section-visibility";
import { toInitialHistoryState } from "@/features/patient-history/lib/history-initial-values";
import { PatientHistoryEmptyState } from "@/features/patient-history/components/PatientHistoryEmptyState";
import { PatientHistoryFormShell } from "@/features/patient-history/components/PatientHistoryFormShell";

interface Props {
  patientId: string | null | undefined;
  specialtyCode: string | null | undefined;
}

function isNotFound(err: unknown): boolean {
  return err instanceof ApiError && err.status === 404;
}

function isStaleVersion(err: unknown): boolean {
  if (!(err instanceof ApiError)) return false;
  if (err.status !== 412 && err.status !== 409) return false;
  const body = err.body as { error?: { code?: string } } | undefined;
  return body?.error?.code === "STALE_VERSION";
}

export function HistoryTab({ patientId, specialtyCode }: Props) {
  const t = useTranslations("patient_history.workspace");
  const config = useMemo(
    () => (patientId ? resolveSpecialtyHistory(specialtyCode, patientId) : null),
    [patientId, specialtyCode],
  );

  const profileId = useAuthContextStore((s) => s.profileId);
  const visibility = useSectionVisibility(profileId ?? null);
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

  const dataQuery = usePatientHistory(config?.endpointPath ?? null);
  const patchMut = usePatchPatientHistory(config?.endpointPath ?? "");

  if (!patientId) {
    return <PatientHistoryEmptyState reason="no_specialty" />;
  }
  if (!config) {
    return <PatientHistoryEmptyState reason="no_specialty" />;
  }
  if (isNotFound(templateQuery.error) || isNotFound(dataQuery.error)) {
    return (
      <PatientHistoryEmptyState reason="no_template" specialtyCode={specialtyCode} />
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
  if (!templateQuery.data || !dataQuery.data) {
    return (
      <div className="p-6 text-xs text-red-500">
        {t("loadError")}
      </div>
    );
  }

  const template = templateQuery.data;
  const envelope = dataQuery.data;
  const initial = toInitialHistoryState(envelope, template);

  return (
    <TemplateExecutionContextProvider
      template={template}
      initialFormValues={initial.formValues}
      initialSearchState={initial.searchState}
      initialRepeatableRows={initial.repeatableRows}
    >
      <PatientHistoryFormShell
        template={template}
        patientId={patientId}
        version={envelope.version}
        visibility={visibility}
        saving={patchMut.isPending}
        onSave={async (body) => {
          try {
            await patchMut.mutateAsync({ ifMatchVersion: envelope.version, body });
            toast.success(t("saved"));
          } catch (err) {
            if (isStaleVersion(err)) {
              toast.warning(t("staleVersion"));
              await qc.invalidateQueries({
                queryKey: patientHistoryKey(config.endpointPath),
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
