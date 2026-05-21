"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TemplateRenderer } from "@/builder/renderer/TemplateRenderer";
import { useTemplateExecution } from "@/builder/runtime/TemplateExecutionContext";
import { buildTemplateSubmission } from "@/builder/templates/build-submission";
import type { FormSectionDto, FormTemplateDto } from "@/builder/templates/template.types";
import { SectionNotesInline } from "@/features/patient-history/components/SectionNotesInline";

const EXAMINATION_GROUP = "Examination";

interface Props {
  template: FormTemplateDto;
  patientId: string;
  onSave: (body: Record<string, unknown>) => Promise<void>;
  saving: boolean;
}

export function VisitExaminationFormShell({
  template,
  patientId,
  onSave,
  saving,
}: Props) {
  const t = useTranslations("examination.workspace");
  const execution = useTemplateExecution();
  const [errors, setErrors] = useState<Record<string, string> | undefined>(undefined);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  function toggleSection(code: string) {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function isExaminationSection(section: FormSectionDto): boolean {
    return (section.config?.ui?.group as string | undefined) === EXAMINATION_GROUP;
  }

  const renderSectionHeaderSlot = (section: FormSectionDto) => {
    if (!isExaminationSection(section)) return undefined;
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

  const renderSectionBottomSlot = (section: FormSectionDto) => {
    if (!isExaminationSection(section)) return null;
    return <SectionNotesInline patientId={patientId} sectionCode={section.code} />;
  };

  async function handleSave() {
    setErrors(undefined);
    const body = buildTemplateSubmission(template, execution.state);
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
          renderSectionHeaderSlot={renderSectionHeaderSlot}
          renderSectionBottomSlot={renderSectionBottomSlot}
        />
      </div>
      <div className="sticky bottom-0 left-0 right-0 mt-4 flex items-center justify-end gap-3 border-t border-gray-100 bg-white/95 px-4 py-3 backdrop-blur">
        <Button onClick={handleSave} disabled={saving} className="bg-brand-primary">
          {saving ? <Loader2 size={14} className="animate-spin" /> : null}
          <span className="ml-2">{t("save")}</span>
        </Button>
      </div>
    </div>
  );
}
