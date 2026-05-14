"use client";

import { fieldClass, FieldShell } from "../field-shell";
import { useDefaultValue } from "../../runtime/useDefaultValue";
import type { FieldInputProps } from "../input-props";

const EMPTY_OPTIONS: never[] = [];

// `<input type="date">` requires `yyyy-MM-dd`; autofill sources (e.g. patient
// search) return full ISO datetimes like `1999-12-17T00:00:00.000Z`.
function toDateInputValue(value: unknown): string {
  if (typeof value !== "string" || value.length === 0) return "";
  return value.length > 10 && value[10] === "T" ? value.slice(0, 10) : value;
}

export function DateInput({ field, value, onChange, required, disabled, error }: FieldInputProps) {
  useDefaultValue(field, EMPTY_OPTIONS);
  return (
    <FieldShell label={field.label} required={required} error={error}>
      <input
        type="date"
        value={toDateInputValue(value)}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={fieldClass}
      />
    </FieldShell>
  );
}

export function DateTimeInput({
  field,
  value,
  onChange,
  required,
  disabled,
  error,
}: FieldInputProps) {
  useDefaultValue(field, EMPTY_OPTIONS);
  return (
    <FieldShell label={field.label} required={required} error={error}>
      <input
        type="datetime-local"
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={fieldClass}
      />
    </FieldShell>
  );
}
