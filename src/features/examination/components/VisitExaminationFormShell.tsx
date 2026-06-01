"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TemplateRenderer } from "@/builder/renderer/TemplateRenderer";
import {
  useEvaluationContext,
  useTemplateExecution,
} from "@/builder/runtime/TemplateExecutionContext";
import { buildTemplateSubmission } from "@/builder/templates/build-submission";
import { useCarePaths } from "@/features/care-paths/lib/useCarePaths";
import {
  HISTORY_SECTION_PREFIX,
  OBGYN_EXAM_CONTAINERS,
} from "@/features/examination/lib/history-binding";
import type { FormSectionDto, FormTemplateDto } from "@/builder/templates/template.types";

const EXAMINATION_GROUP = "Examination";
const DEFAULT_CARE_PATH = "OBGYN_GENERAL";

/**
 * Sections that get an eye-icon hide/show toggle and start collapsed by
 * default: the embedded care-path `history_*` sections and the body-system
 * examination sections. Main complaint, care path, vitals, diagnosis, and
 * treatment-plan sections stay always visible.
 */
function isToggleableSection(section: FormSectionDto): boolean {
  const group = section.config?.ui?.group as string | undefined;
  return (
    group === EXAMINATION_GROUP ||
    section.code.startsWith(HISTORY_SECTION_PREFIX)
  );
}

interface Props {
  template: FormTemplateDto;
  patientId: string;
  specialtyCode?: string | null;
  onSave: (body: Record<string, unknown>) => Promise<void>;
  saving: boolean;
  /** Render the form static (no inputs, no Save) — viewing a past visit. */
  readOnly?: boolean;
}

export function VisitExaminationFormShell({
  template,
  specialtyCode,
  onSave,
  saving,
  readOnly = false,
}: Props) {
  const t = useTranslations("examination.workspace");
  const execution = useTemplateExecution();
  const ctx = useEvaluationContext();
  const [errors, setErrors] = useState<Record<string, string> | undefined>(undefined);
  // History + examination sections start collapsed; the doctor expands what
  // they need via the per-section eye icon.
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    () =>
      new Set(template.sections.filter(isToggleableSection).map((s) => s.code)),
  );

  // Care-path-gated history sections: only the embedded `history_*` sections
  // listed by the selected care path are rendered AND submitted.
  const { data: carePaths = [] } = useCarePaths(specialtyCode);
  const selectedPath =
    (typeof ctx.case_path === "string" ? ctx.case_path : null) ??
    DEFAULT_CARE_PATH;
  const hiddenSectionCodes = useMemo(() => {
    const active = new Set(
      carePaths.find((cp) => cp.code === selectedPath)?.history_section_codes ??
        [],
    );
    const hidden = new Set<string>();
    for (const section of template.sections) {
      if (
        section.code.startsWith(HISTORY_SECTION_PREFIX) &&
        !active.has(section.code)
      ) {
        hidden.add(section.code);
      }
    }
    return hidden;
  }, [carePaths, selectedPath, template.sections]);

  function toggleSection(code: string) {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  const renderSectionHeaderSlot = (section: FormSectionDto) => {
    if (!isToggleableSection(section)) return undefined;
    const isCollapsed = collapsedSections.has(section.code);
    return (
      <button
        type="button"
        aria-label={isCollapsed ? t("showSection") : t("hideSection")}
        onClick={() => toggleSection(section.code)}
        className="rounded p-1 text-gray-400 transition-colors hover:text-gray-600"
      >
        {isCollapsed ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    );
  };

  async function handleSave() {
    setErrors(undefined);
    const body = buildTemplateSubmission(template, execution.state, {
      namespaceContainers: OBGYN_EXAM_CONTAINERS,
      excludeSectionCodes: hiddenSectionCodes,
    });
    try {
      await onSave(body);
    } catch (err) {
      if (err && typeof err === "object" && "body" in err) {
        const apiBody = (err as { body?: unknown }).body;
        if (apiBody && typeof apiBody === "object" && "error" in apiBody) {
          const details = (apiBody as { error?: { details?: unknown } }).error?.details;
          if (
            details &&
            typeof details === "object" &&
            "fields" in details &&
            typeof (details as { fields?: unknown }).fields === "object"
          ) {
            const fields = (details as { fields: Record<string, string[]> }).fields;
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
      <div className="min-w-0 flex-1 overflow-y-auto px-1 pb-24">
        <TemplateRenderer
          template={template}
          errors={errors}
          collapsedSections={collapsedSections}
          hiddenSectionCodes={hiddenSectionCodes}
          renderSectionHeaderSlot={renderSectionHeaderSlot}
          displayOnly={readOnly}
        />
      </div>
      {!readOnly && (
        <div className="sticky bottom-0 left-0 right-0 mt-4 flex items-center justify-end gap-3 border-t border-gray-100 bg-white/95 px-4 py-3 backdrop-blur">
          <Button onClick={handleSave} disabled={saving} className="bg-brand-primary">
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            <span className="ml-2">{t("save")}</span>
          </Button>
        </div>
      )}
    </div>
  );
}
