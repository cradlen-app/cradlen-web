"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TemplateRenderer } from "@/builder/renderer/TemplateRenderer";
import { useTemplateExecution } from "@/builder/runtime/TemplateExecutionContext";
import { buildTemplateSubmission } from "@/builder/templates/build-submission";
import type { FormTemplateDto } from "@/builder/templates/template.types";

interface Props {
  template: FormTemplateDto;
  onSave: (body: Record<string, unknown>) => Promise<void>;
  saving: boolean;
  /** Frozen snapshot (e.g. a past visit's drawer): whole template static, no Save. */
  readOnly?: boolean;
  /**
   * The phase the visit currently sits in (e.g. surgical Pre-op=1 / Operative=2
   * / Post-op=3). Collapsible sections whose `config.ui.phaseOrder` differs
   * start collapsed, so the current phase opens expanded. Null → the first
   * collapsible phase (order 1) opens.
   */
  currentPhaseOrder?: number | null;
}

/**
 * Generic render+save shell for a journey clinical surface. Flattens every
 * binding to the envelope root (no namespace containers) — the backend demuxes
 * fields into the journey/episode/visit records by binding namespace.
 */
export function JourneyClinicalFormShell({
  template,
  onSave,
  saving,
  readOnly = false,
  currentPhaseOrder = null,
}: Props) {
  const t = useTranslations("examination.workspace");
  const execution = useTemplateExecution();
  const [errors, setErrors] = useState<Record<string, string> | undefined>(
    undefined,
  );

  // Sections flagged `config.ui.readOnly` (e.g. the pregnancy Summary) render
  // read-only AND are excluded from submission — their fields mirror the
  // editable sections, which own the writes.
  const readOnlySectionCodes = useMemo(
    () =>
      new Set(
        template.sections
          .filter(
            (s) =>
              (s.config?.ui as { readOnly?: boolean } | undefined)?.readOnly ===
              true,
          )
          .map((s) => s.code),
      ),
    [template.sections],
  );

  // Collapsible phase sections that should START collapsed: every one whose
  // `config.ui.phaseOrder` is not the visit's current phase. With no current
  // phase, keep the first phase (order 1) open and collapse the rest.
  const defaultCollapsedSectionCodes = useMemo(() => {
    const expandOrder = currentPhaseOrder ?? 1;
    return new Set(
      template.sections
        .filter((s) => {
          const ui = s.config?.ui as
            | { collapsible?: boolean; phaseOrder?: number }
            | undefined;
          return ui?.collapsible === true && ui?.phaseOrder !== expandOrder;
        })
        .map((s) => s.code),
    );
  }, [template.sections, currentPhaseOrder]);

  async function handleSave() {
    setErrors(undefined);
    const body = buildTemplateSubmission(template, execution.state, {
      excludeSectionCodes: readOnlySectionCodes,
    });
    try {
      await onSave(body);
    } catch (err) {
      if (err && typeof err === "object" && "body" in err) {
        const apiBody = (err as { body?: unknown }).body;
        if (apiBody && typeof apiBody === "object" && "error" in apiBody) {
          const details = (apiBody as { error?: { details?: unknown } }).error
            ?.details;
          if (
            details &&
            typeof details === "object" &&
            "fields" in details &&
            typeof (details as { fields?: unknown }).fields === "object"
          ) {
            const fields = (details as { fields: Record<string, string[]> })
              .fields;
            const mapped: Record<string, string> = {};
            for (const [k, msgs] of Object.entries(fields)) {
              if (Array.isArray(msgs) && msgs[0]) mapped[k] = msgs[0];
            }
            setErrors(mapped);
          }
        }
      }
    }
  }

  return (
    <div className="flex h-full min-w-0 flex-col overflow-x-hidden">
      <div className="min-w-0 flex-1 overflow-y-auto px-1 pb-2">
        <TemplateRenderer
          template={template}
          errors={errors}
          displayOnly={readOnly}
          readOnlySectionCodes={readOnlySectionCodes}
          defaultCollapsedSectionCodes={defaultCollapsedSectionCodes}
        />
      </div>
      {!readOnly && (
        <div className="sticky bottom-0 left-0 right-0 mt-4 flex items-center justify-end gap-3 border-t border-gray-100 bg-white/95 px-4 py-3 backdrop-blur">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-brand-primary"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            <span className="ml-2">{t("save")}</span>
          </Button>
        </div>
      )}
    </div>
  );
}
