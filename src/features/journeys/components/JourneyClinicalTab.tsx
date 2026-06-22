"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ApiError } from "@/infrastructure/http/api";
import { fetchFormTemplate } from "@/builder/templates/templates.api";
import { queryKeys } from "@/lib/queryKeys";
import { TemplateExecutionContextProvider } from "@/builder/runtime/TemplateExecutionContext";
import { toInitialFormState } from "@/builder/templates/initial-values";
import {
  useJourneyClinical,
  usePatchJourneyClinical,
} from "../lib/useJourneyClinical";
import { JourneyClinicalFormShell } from "./JourneyClinicalFormShell";
import { PregnancyDerivedFields } from "./PregnancyDerivedFields";
import { JourneyClinicalContext } from "../lib/journey-clinical-context";
import type { JourneyDescriptorDto } from "../types/journey.types";

const PREGNANCY_CODE = "OBGYN_PREGNANCY";

interface Props {
  visitId: string;
  descriptor: JourneyDescriptorDto;
  /** Frozen snapshot (e.g. the visit-details drawer for a past visit): render
   *  the whole surface read-only — no Save, no derived-field mutation, no
   *  interactive status control. */
  readOnly?: boolean;
}

function isNotFound(err: unknown): boolean {
  return err instanceof ApiError && err.status === 404;
}

/**
 * Generic clinical surface for the visit's active journey (e.g. pregnancy
 * profile + per-visit surveillance). Template-driven. Last-write-wins on save
 * (no If-Match), like the Examination tab; `version` is just the remount/cache
 * token. Dormant until a care path declares a surface.
 */
export function JourneyClinicalTab({
  visitId,
  descriptor,
  readOnly = false,
}: Props) {
  const t = useTranslations("examination.workspace");
  const surface = descriptor.clinical_surface;
  const journeyId = descriptor.journey_id;

  const templateQuery = useQuery({
    queryKey: surface
      ? queryKeys.formTemplates.byCode(surface.template_code, null)
      : (["form-template", "disabled"] as const),
    queryFn: () => fetchFormTemplate(surface!.template_code),
    enabled: !!surface,
    staleTime: Infinity,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 404) return false;
      return failureCount < 2;
    },
  });

  const dataQuery = useJourneyClinical(visitId, surface ? journeyId : null);
  const patchMut = usePatchJourneyClinical(visitId, journeyId);

  if (!surface) {
    return <div className="p-6 text-xs text-gray-500">{t("loadError")}</div>;
  }
  if (isNotFound(templateQuery.error) || isNotFound(dataQuery.error)) {
    return <div className="p-6 text-xs text-gray-500">{t("loadError")}</div>;
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
    return <div className="p-6 text-xs text-red-500">{t("loadError")}</div>;
  }

  const template = templateQuery.data;
  const envelope = dataQuery.data;
  const initial = toInitialFormState(envelope, template);

  const body = (
    <TemplateExecutionContextProvider
      key={envelope.version}
      template={template}
      initialFormValues={initial.formValues}
      initialSearchState={initial.searchState}
      initialRepeatableRows={initial.repeatableRows}
    >
      {!readOnly && descriptor.care_path_code === PREGNANCY_CODE && (
        <PregnancyDerivedFields />
      )}
      <JourneyClinicalFormShell
        template={template}
        readOnly={readOnly}
        saving={patchMut.isPending || dataQuery.isFetching}
        onSave={async (saveBody) => {
          try {
            await patchMut.mutateAsync({ body: saveBody });
            toast.success(t("saved"));
          } catch (err) {
            const message =
              err instanceof Error ? err.message : t("saveError");
            toast.error(message);
            throw err;
          }
        }}
      />
    </TemplateExecutionContextProvider>
  );

  // Read-only snapshot needs no visitId context — the status select renders
  // static (no close drawer) under the template's hard read-only.
  return readOnly ? (
    body
  ) : (
    <JourneyClinicalContext.Provider value={{ visitId }}>
      {body}
    </JourneyClinicalContext.Provider>
  );
}
