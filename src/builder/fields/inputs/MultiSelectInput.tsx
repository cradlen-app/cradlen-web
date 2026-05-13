"use client";

import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/common/utils/utils";
import { FieldShell } from "../field-shell";
import { useDynamicOptions } from "../../runtime/useDynamicOptions";
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
  const dynamic = useDynamicOptions(field);
  const options: FieldOption[] = useMemo(() => {
    if (dynamic.enabled) {
      return dynamic.options.map(({ code, label }) => ({ code, label }));
    }
    return (field.config?.validation?.options as FieldOption[] | undefined) ?? [];
  }, [dynamic.enabled, dynamic.options, field.config?.validation?.options]);
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
      {dynamic.isLoading ? (
        <div className="flex items-center gap-2 pt-1.5 text-[11px] text-gray-400">
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          Loading…
        </div>
      ) : dynamic.isError ? (
        <p className="pt-1.5 text-[11px] text-red-500">Failed to load options</p>
      ) : options.length === 0 ? (
        <p className="pt-1.5 text-[11px] text-gray-400">No options</p>
      ) : (
        <div className="flex flex-wrap gap-1.5 pt-1.5">
          {options.map((opt, idx) => {
            const isActive = selected.includes(opt.code);
            return (
              <button
                key={opt.code ?? `__opt-${idx}`}
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
      )}
    </FieldShell>
  );
}
