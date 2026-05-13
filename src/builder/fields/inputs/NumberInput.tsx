"use client";

import { fieldClass, FieldShell } from "../field-shell";
import type { FieldInputProps } from "../input-props";

interface Options {
  step?: number;
}

function makeNumberInput({ step }: Options = {}) {
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
    return (
      <FieldShell label={field.label} required={required} error={error}>
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
          className={fieldClass}
        />
      </FieldShell>
    );
  };
}

export const NumberInput = makeNumberInput({ step: 1 });
export const DecimalInput = makeNumberInput({ step: 0.1 });
