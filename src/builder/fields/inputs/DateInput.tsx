"use client";

import { fieldClass, FieldShell } from "../field-shell";
import type { FieldInputProps } from "../input-props";

export function DateInput({ field, value, onChange, required, disabled, error }: FieldInputProps) {
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
