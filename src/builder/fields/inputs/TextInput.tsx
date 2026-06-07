"use client";

import { fieldClass, FieldShell } from "../field-shell";
import type { FieldInputProps } from "../input-props";

export function TextInput({ field, value, onChange, required, disabled, error, flagged }: FieldInputProps) {
  const placeholder = (field.config?.ui?.placeholder as string | undefined) ?? "";
  const maxLength = field.config?.validation?.maxLength as number | undefined;
  const minLength = field.config?.validation?.minLength as number | undefined;
  const pattern = field.config?.validation?.pattern as string | undefined;
  return (
    <FieldShell label={field.label} required={required} error={error} flagged={flagged}>
      <input
        type="text"
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        minLength={minLength}
        pattern={pattern}
        disabled={disabled}
        className={fieldClass}
      />
    </FieldShell>
  );
}
