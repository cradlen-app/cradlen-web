"use client";

import { cn } from "@/common/utils/utils";
import { FieldShell } from "../field-shell";
import type { FieldInputProps } from "../input-props";
import type { FieldOption } from "../../templates/template.types";

export function MultiSelectInput({
  field,
  value,
  onChange,
  required,
  disabled,
  error,
}: FieldInputProps) {
  const options = (field.config?.validation?.options as FieldOption[] | undefined) ?? [];
  const selected = Array.isArray(value) ? (value as string[]) : [];

  function toggle(code: string) {
    if (disabled) return;
    const next = selected.includes(code)
      ? selected.filter((c) => c !== code)
      : [...selected, code];
    onChange(next);
  }

  return (
    <FieldShell label={field.label} required={required} error={error}>
      <div className="flex flex-wrap gap-1.5 pt-1.5">
        {options.map((opt) => {
          const isActive = selected.includes(opt.code);
          return (
            <button
              key={opt.code}
              type="button"
              onClick={() => toggle(opt.code)}
              aria-pressed={isActive}
              disabled={disabled}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                isActive
                  ? "border-brand-primary bg-brand-primary text-white"
                  : "border-gray-200 bg-gray-50/70 text-gray-600 hover:border-brand-primary/30 hover:text-brand-black",
                disabled && "opacity-50",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </FieldShell>
  );
}
