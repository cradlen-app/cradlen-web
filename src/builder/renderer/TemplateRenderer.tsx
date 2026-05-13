"use client";

import { useMemo } from "react";
import { applyEffect } from "../rules/predicate.evaluator";
import { useEvaluationContext } from "../runtime/TemplateExecutionContext";
import { useDiscriminatorReset } from "../runtime/useDiscriminatorReset";
import { useSpecialtyAutoFill } from "../runtime/useSpecialtyAutoFill";
import { SectionContainer } from "../sections/SectionContainer";
import { FieldRenderer, FULL_WIDTH_TYPES } from "./FieldRenderer";
import type { FormSectionDto, FormTemplateDto } from "../templates/template.types";

interface Props {
  template: FormTemplateDto;
  errors?: Record<string, string>;
}

export function TemplateRenderer({ template, errors }: Props) {
  useDiscriminatorReset();
  useSpecialtyAutoFill();
  const ctx = useEvaluationContext();

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

  return (
    <div className="space-y-5">
      {visibleSections.map((section) => (
        <SectionContainer key={section.id} title={section.name}>
          {section.fields
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((field) => (
              <FieldRenderer
                key={field.id}
                field={field}
                error={errors?.[field.code]}
                fullWidth={FULL_WIDTH_TYPES.has(field.type)}
              />
            ))}
        </SectionContainer>
      ))}
    </div>
  );
}
