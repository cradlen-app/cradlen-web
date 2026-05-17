"use client";

import { cn } from "@/common/utils/utils";
import { fieldClass, FieldShell } from "../field-shell";
import type { FieldInputProps } from "../input-props";

interface Options {
  step?: number;
}

function makeNumberInput({ step: defaultStep }: Options = {}) {
  return function NumberInputComponent({
    field,
    value,
    onChange,
    required,
    disabled,
    error,
  }: FieldInputProps) {
    const min = field.config?.validation?.min as number | undefined;
    const max = field.config?.validation?.max as number | undefined;
    // Field-level `ui.step` wins over the factory default — lets the seed
    // tighten precision per-field (e.g. temperature_c uses 0.1).
    const step = (field.config?.ui?.step as number | undefined) ?? defaultStep;
    const suffix = field.config?.ui?.suffix as string | undefined;
    const input = (
      <input
        type="number"
        value={value === null || value === undefined ? "" : String(value)}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") {
            onChange(null);
            return;
          }
          const n = Number(raw);
          onChange(Number.isFinite(n) ? n : null);
        }}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={cn(fieldClass, suffix && "pr-10")}
      />
    );
    return (
      <FieldShell label={field.label} required={required} error={error}>
        {suffix ? (
          <div className="relative">
            {input}
            <span
              className="pointer-events-none absolute end-0 top-1/2 -translate-y-1/2 text-[11px] text-gray-400"
              aria-hidden="true"
            >
              {suffix}
            </span>
          </div>
        ) : (
          input
        )}
      </FieldShell>
    );
  };
}

export const NumberInput = makeNumberInput({ step: 1 });
export const DecimalInput = makeNumberInput({ step: 0.1 });
