"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TemplateRenderer } from "@/builder/renderer/TemplateRenderer";
import { useTemplateExecution } from "@/builder/runtime/TemplateExecutionContext";
import type { FormTemplateDto } from "@/builder/templates/template.types";
import { buildPatientHistorySubmission } from "../lib/history-submission";
import type { SectionVisibility } from "../lib/section-visibility";
import { slugifyGroup } from "../lib/slug";
import { SectionNotesButton } from "./SectionNotesButton";

interface Props {
  template: FormTemplateDto;
  patientId: string;
  version: number;
  visibility: SectionVisibility;
  onSave: (body: Record<string, unknown>) => Promise<void>;
  saving: boolean;
}

export function PatientHistoryFormShell({
  template,
  patientId,
  version,
  visibility,
  onSave,
  saving,
}: Props) {
  const t = useTranslations("patient_history.workspace");
  const execution = useTemplateExecution();
  const [errors, setErrors] = useState<Record<string, string> | undefined>(undefined);

  const renderGroupHeaderSlot = (groupName: string) => {
    const isHidden = visibility.isHidden(groupName);
    return (
      <div className="flex items-center gap-1">
        <SectionNotesButton
          patientId={patientId}
          sectionCode={slugifyGroup(groupName)}
          groupName={groupName}
        />
        <button
          type="button"
          aria-label={isHidden ? t("showSection") : t("hideSection")}
          onClick={() => visibility.toggle(groupName)}
          className="rounded p-1 text-gray-400 transition-colors hover:text-gray-600"
        >
          {isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    );
  };

  async function handleSave() {
    setErrors(undefined);
    const body = buildPatientHistorySubmission(template, execution.state);
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
          renderGroupHeaderSlot={renderGroupHeaderSlot}
          collapsedGroups={visibility.hidden}
        />
      </div>
      <div className="sticky bottom-0 left-0 right-0 mt-4 flex items-center justify-between gap-3 border-t border-gray-100 bg-white/95 px-4 py-3 backdrop-blur">
        <span className="text-[11px] text-gray-400">
          {t("versionLabel", { version })}
        </span>
        <Button onClick={handleSave} disabled={saving} className="bg-brand-primary">
          {saving ? <Loader2 size={14} className="animate-spin" /> : null}
          <span className="ml-2">{t("save")}</span>
        </Button>
      </div>
    </div>
  );
}