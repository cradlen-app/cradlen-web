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
   * Optional slot next to each ATOMIC section title. Used by templates that
   * don't carry group annotations (e.g. the book-visit drawer).
   */
  renderSectionHeaderSlot?: (section: FormSectionDto) => ReactNode;
}

export function TemplateRenderer({
  template,
  errors,
  renderGroupHeaderSlot,
  collapsedGroups,
  renderSectionHeaderSlot,
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
                  title={section.name}
                  headerSlot={
                    group.name === null
                      ? renderSectionHeaderSlot?.(section)
                      : undefined
                  }
                  layout={section.is_repeatable ? "stack" : "grid"}
                >
                  {section.is_repeatable ? (
                    <RepeatableSectionRenderer section={section} errors={errors} />
                  ) : (
                    section.fields
                      .slice()
                      .filter((f) => !hiddenIdTargets.has(f.code))
                      .sort((a, b) => a.order - b.order)
                      .map((field) => (
                        <FieldRenderer
                          key={field.id}
                          field={field}
                          error={errors?.[field.code]}
                        />
                      ))
                  )}
                </SectionContainer>
              ))}
          </div>
        );
      })}
    </div>
  );
}