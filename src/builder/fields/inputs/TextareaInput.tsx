"use client";

import { cn } from "@/common/utils/utils";
import { fieldClass, FieldShell } from "../field-shell";
import type { FieldInputProps } from "../input-props";

export function TextareaInput({ field, value, onChange, required, disabled, error }: FieldInputProps) {
  const placeholder = (field.config?.ui?.placeholder as string | undefined) ?? "";
  const maxLength = field.config?.validation?.maxLength as number | undefined;
  return (
    <FieldShell label={field.label} required={required} error={error}>
      <textarea
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        rows={3}
        className={cn(fieldClass, "h-auto resize-y py-2")}
      />
    </FieldShell>
  );
}
