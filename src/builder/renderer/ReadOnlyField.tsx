"use client";

import { useFieldValue } from "../runtime/useFieldState";
import { FieldShell } from "../fields/field-shell";
import type { FormFieldDto } from "../templates/template.types";

function optionLabel(field: FormFieldDto, code: unknown): string {
  const opts = field.config?.validation?.options ?? [];
  const found = opts.find((o) => o.code === code);
  return found ? found.label : String(code);
}

/** Render a field's stored value as static text for display-only templates. */
function formatValue(field: FormFieldDto, value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  switch (field.type) {
    case "MULTISELECT":
      if (Array.isArray(value)) {
        return value.length
          ? value.map((v) => optionLabel(field, v)).join(", ")
          : "—";
      }
      return optionLabel(field, value);
    case "SELECT":
      return optionLabel(field, value);
    case "BOOLEAN":
      return value ? "Yes" : "No";
    default:
      return String(value);
  }
}

interface Props {
  field: FormFieldDto;
}

export function ReadOnlyField({ field }: Props) {
  const value = useFieldValue(field.code);
  return (
    <FieldShell label={field.label}>
      <p className="min-h-9 whitespace-pre-wrap py-2 text-xs text-brand-black">
        {formatValue(field, value)}
      </p>
    </FieldShell>
  );
}
