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

function toYmd(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Native picker bounds from `config.validation`: `notInFuture` caps at today,
// `maxAgeYears` floors at today − N years. Authoritative check lives in
// client-validator; these just restrict the picker.
function dateBounds(field: FieldInputProps["field"]): { min?: string; max?: string } {
  const v = field.config?.validation;
  const bounds: { min?: string; max?: string } = {};
  if (!v) return bounds;
  const now = new Date();
  if (v.notInFuture === true) bounds.max = toYmd(now);
  if (typeof v.maxAgeYears === "number") {
    const earliest = new Date(now);
    earliest.setFullYear(earliest.getFullYear() - v.maxAgeYears);
    bounds.min = toYmd(earliest);
  }
  return bounds;
}

export function DateInput({ field, value, onChange, required, disabled, error, flagged }: FieldInputProps) {
  useDefaultValue(field, EMPTY_OPTIONS);
  const { min, max } = dateBounds(field);
  return (
    <FieldShell label={field.label} required={required} error={error} flagged={flagged}>
      <input
        type="date"
        value={toDateInputValue(value)}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
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
  flagged,
}: FieldInputProps) {
  useDefaultValue(field, EMPTY_OPTIONS);
  const { min, max } = dateBounds(field);
  return (
    <FieldShell label={field.label} required={required} error={error} flagged={flagged}>
      <input
        type="datetime-local"
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        disabled={disabled}
        className={fieldClass}
      />
    </FieldShell>
  );
}
