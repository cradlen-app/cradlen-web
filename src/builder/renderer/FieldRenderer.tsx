"use client";

import { useMemo } from "react";
import { applyEffect } from "../rules/predicate.evaluator";
import { useEvaluationContext, useTemplateExecution } from "../runtime/TemplateExecutionContext";
import { useFieldValue, useSetFieldValue } from "../runtime/useFieldState";
import { TextInput } from "../fields/inputs/TextInput";
import { TextareaInput } from "../fields/inputs/TextareaInput";
import { NumberInput, DecimalInput } from "../fields/inputs/NumberInput";
import { DateInput, DateTimeInput } from "../fields/inputs/DateInput";
import { BooleanInput } from "../fields/inputs/BooleanInput";
import { SelectInput } from "../fields/inputs/SelectInput";
import { MultiSelectInput } from "../fields/inputs/MultiSelectInput";
import { ComputedInput } from "../fields/inputs/ComputedInput";
import { EntitySearchInput } from "../fields/inputs/EntitySearchInput";
import type { FormFieldDto, FormFieldType } from "../templates/template.types";

const INPUT_BY_TYPE: Record<FormFieldType, React.ComponentType<{
  field: FormFieldDto;
  value: unknown;
  onChange: (v: unknown) => void;
  required: boolean;
  disabled: boolean;
  error?: string;
}>> = {
  TEXT: TextInput,
  TEXTAREA: TextareaInput,
  NUMBER: NumberInput,
  DECIMAL: DecimalInput,
  DATE: DateInput,
  DATETIME: DateTimeInput,
  BOOLEAN: BooleanInput,
  SELECT: SelectInput,
  MULTISELECT: MultiSelectInput,
  ENTITY_SEARCH: EntitySearchInput,
  COMPUTED: ComputedInput,
};

interface Props {
  field: FormFieldDto;
  error?: string;
}

/** Tailwind `col-span-N` class for every valid N (avoids dynamic class names). */
const COL_SPAN_CLASS: Record<number, string> = {
  1: "col-span-1",
  2: "col-span-2",
  3: "col-span-3",
  4: "col-span-4",
  5: "col-span-5",
  6: "col-span-6",
  7: "col-span-7",
  8: "col-span-8",
  9: "col-span-9",
  10: "col-span-10",
  11: "col-span-11",
  12: "col-span-12",
};

function resolveColSpan(field: FormFieldDto): number {
  const explicit = field.config?.ui?.colSpan;
  if (typeof explicit === "number" && explicit >= 1 && explicit <= 12) {
    return explicit;
  }
  // Defaults: TEXTAREA/ENTITY_SEARCH are always full-width. MULTISELECT is
  // full-width unless rendered as a compact checkbox row (variant=checkboxes).
  if (field.type === "TEXTAREA") return 12;
  if (field.type === "ENTITY_SEARCH" || field.config?.ui?.searchEntity) return 12;
  if (field.type === "MULTISELECT") {
    return field.config?.ui?.variant === "checkboxes" ? 12 : 12;
  }
  // Default half-row for plain inputs.
  return 6;
}

export function FieldRenderer({ field, error }: Props) {
  const ctx = useEvaluationContext();
  const value = useFieldValue(field.code);
  const setFieldValue = useSetFieldValue();
  const { patchSearch } = useTemplateExecution();

  const visible = useMemo(
    () => applyEffect(field.config?.logic?.predicates, "visible", ctx, true),
    [field.config?.logic?.predicates, ctx],
  );
  const enabled = useMemo(
    () => applyEffect(field.config?.logic?.predicates, "enabled", ctx, true),
    [field.config?.logic?.predicates, ctx],
  );
  const required = useMemo(
    () =>
      field.required ||
      applyEffect(field.config?.logic?.predicates, "required", ctx, false),
    [field.required, field.config?.logic?.predicates, ctx],
  );

  if (!visible) {
    // Lookup fields that were resolved but later hidden should release their id.
    if (field.type === "ENTITY_SEARCH") {
      // Clearing is handled by useDiscriminatorReset on discriminator change;
      // hiding alone shouldn't drop a resolved id (predicates may toggle off
      // briefly during typing). Intentionally no-op here.
    }
    return null;
  }

  // Fields tagged with `ui.searchEntity` render as autocompletes regardless of
  // declared type (template v2 keeps the visible name field typed `TEXT`).
  const Input = field.config?.ui?.searchEntity
    ? EntitySearchInput
    : INPUT_BY_TYPE[field.type];
  if (!Input) {
    return (
      <div className="col-span-12 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
        Unsupported field type: {field.type} ({field.code})
      </div>
    );
  }

  const onChange = (v: unknown) => {
    setFieldValue(field.code, v);
    // Hidden side effect: changing the patient lookup resolved id is handled
    // inside the EntitySearchInput via patchSearch — keep this for symmetry.
    void patchSearch;
  };

  const span = resolveColSpan(field);

  return (
    <div className={COL_SPAN_CLASS[span] ?? COL_SPAN_CLASS[6]}>
      <Input
        field={field}
        value={value}
        onChange={onChange}
        required={required}
        disabled={!enabled}
        error={error}
      />
    </div>
  );
}

/** Field types that should render across both columns of the section grid. */
export const FULL_WIDTH_TYPES: ReadonlySet<FormFieldType> = new Set([
  "TEXTAREA",
  "MULTISELECT",
  "ENTITY_SEARCH",
]);
