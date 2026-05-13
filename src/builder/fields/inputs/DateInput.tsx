"use client";

import { fieldClass, FieldShell } from "../field-shell";
import { useDefaultValue } from "../../runtime/useDefaultValue";
import type { FieldInputProps } from "../input-props";

const EMPTY_OPTIONS: never[] = [];

export function DateInput({ field, value, onChange, required, disabled, error }: FieldInputProps) {
  useDefaultValue(field, EMPTY_OPTIONS);
  return (
    <FieldShell label={field.label} required={required} error={error}>
      <input
        type="date"
        value={typeof value === "string" ? value : ""}
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
