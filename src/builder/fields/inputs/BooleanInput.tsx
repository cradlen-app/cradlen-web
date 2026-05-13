"use client";

import type { FieldInputProps } from "../input-props";

export function BooleanInput({ field, value, onChange, required, disabled, error }: FieldInputProps) {
  return (
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={value === true}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="size-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
      />
      <span className="text-xs font-medium text-brand-black">
        {field.label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      {error ? <span className="ms-2 text-[11px] text-red-500">{error}</span> : null}
    </label>
  );
}
