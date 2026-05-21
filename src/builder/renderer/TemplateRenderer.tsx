"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import { applyEffect } from "../rules/predicate.evaluator";
import { useEvaluationContext } from "../runtime/TemplateExecutionContext";
import { useDiscriminatorReset } from "../runtime/useDiscriminatorReset";
import { useSpecialtyAutoFill } from "../runtime/useSpecialtyAutoFill";
import { SectionContainer } from "../sections/SectionContainer";
import { FieldRenderer } from "./FieldRenderer";
import { RepeatableSectionRenderer } from "./RepeatableSectionRenderer";
import { groupSections } from "./group-sections";
import type { FormSectionDto, FormTemplateDto } from "../templates/template.types";
import type { FieldFlag } from "./field-flag.types";

interface Props {
  template: FormTemplateDto;
  errors?: Record<string, string>;
  /**
   * Optional slot rendered next to each TOP-LEVEL group title (e.g. an
   * eye-icon visibility toggle). Used when the template's sections carry a
   * `config.ui.group` annotation.
   */
  renderGroupHeaderSlot?: (groupName: string) => ReactNode;
  /** Group names the consumer wants visually collapsed (header only). */
  collapsedGroups?: ReadonlySet<string>;
  /**
   * Optional slot next to each ATOMIC section title. Fires for ALL sections
   * regardless of whether they belong to a named group — the callback receives
   * the full section and decides what to render (return undefined to skip).
   */
  renderSectionHeaderSlot?: (section: FormSectionDto) => ReactNode;
  /**
   * Optional slot rendered below the fields of each NON-REPEATABLE section
   * (e.g. an inline notes timeline). Not shown for repeatable sections.
   */
  renderSectionBottomSlot?: (section: FormSectionDto) => ReactNode;
  /**
   * Section codes that should be individually collapsed (independent of
   * group-level collapse). Passed as `collapsed` to each SectionContainer.
   */
  collapsedSections?: ReadonlySet<string>;
  /**
   * Map of section key → ISO timestamp of the last update for that section.
  /**
   * Map of `"section_code.field_code"` → FieldFlagDto for O(1) flag lookups.
   * Supplied by the parent consumer (e.g. PatientHistoryFormShell) after
   * fetching all flags for the current patient.
   */
  flagIndex?: Record<string, FieldFlag>;
  /** Called when the user saves a new flag (or updates an existing one). */
  onFlag?: (section_code: string, field_code: string, note?: string) => void;
  /** Called when the user removes an existing flag. Receives the flag's id. */
  onUnflag?: (flagId: string) => void;
}

export function TemplateRenderer({
  template,
  errors,
  renderGroupHeaderSlot,
  collapsedGroups,
  renderSectionHeaderSlot,
  renderSectionBottomSlot,
  collapsedSections,
  flagIndex,
  onFlag,
  onUnflag,
}: Props) {
  useDiscriminatorReset();
  useSpecialtyAutoFill();
  const ctx = useEvaluationContext();

  // Field codes that are the `idTarget` of another field's `ui.searchEntity`
  // are populated invisibly when the user picks an entity — don't render them.
  const hiddenIdTargets = useMemo(() => {
    const set = new Set<string>();
    for (const section of template.sections) {
      for (const field of section.fields) {
        const target = field.config?.ui?.searchEntity?.idTarget;
        if (typeof target === "string") set.add(target);
      }
    }
    return set;
  }, [template.sections]);

  const visibleSections = useMemo(
    () =>
      template.sections
        .slice()
        .sort((a, b) => a.order - b.order)
        .filter((s: FormSectionDto) =>
          applyEffect(s.config?.logic?.predicates, "visible", ctx, true),
        ),
    [template.sections, ctx],
  );

  const groups = useMemo(() => groupSections(visibleSections), [visibleSections]);

  return (
    <div className="space-y-8">
      {groups.map((group, gIdx) => {
        const groupCollapsed =
          group.name !== null && (collapsedGroups?.has(group.name) ?? false);
        const groupHeaderSlot =
          group.name !== null ? renderGroupHeaderSlot?.(group.name) : undefined;

        return (
          <div
            key={group.name ?? `__ungrouped-${gIdx}`}
            className={
              gIdx > 0 ? "border-t border-gray-100 pt-6 space-y-5" : "space-y-5"
            }
          >
            {group.name ? (
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-brand-black">
                  {group.name}
                </h2>
                {groupHeaderSlot}
              </div>
            ) : null}

            {!groupCollapsed &&
              group.sections.map((section) => (
                <SectionContainer
                  key={section.id}
                  id={section.code}
                  title={section.name}
                  headerSlot={renderSectionHeaderSlot?.(section)}
                  bottomSlot={
                    !section.is_repeatable
                      ? renderSectionBottomSlot?.(section)
                      : undefined
                  }
                  collapsed={collapsedSections?.has(section.code)}
                  layout={section.is_repeatable ? "stack" : "grid"}
                >
                  {section.is_repeatable ? (
                    <RepeatableSectionRenderer section={section} errors={errors} />
                  ) : (
                    section.fields
                      .slice()
                      .filter((f) => !hiddenIdTargets.has(f.code))
                      .sort((a, b) => a.order - b.order)
                      .map((field) => {
                        const flagKey = `${section.code}.${field.code}`;
                        const existingFlag = flagIndex?.[flagKey];
                        return (
                          <FieldRenderer
                            key={field.id}
                            field={field}
                            error={errors?.[field.code]}
                            flagged={!!existingFlag}
                            existingFlag={existingFlag}
                            onFlag={
                              onFlag
                                ? (note) => onFlag(section.code, field.code, note)
                                : undefined
                            }
                            onUnflag={
                              onUnflag && existingFlag
                                ? () => onUnflag(existingFlag.id)
                                : undefined
                            }
                          />
                        );
                      })
                  )}
                </SectionContainer>
              ))}
          </div>
        );
      })}
    </div>
  );
}