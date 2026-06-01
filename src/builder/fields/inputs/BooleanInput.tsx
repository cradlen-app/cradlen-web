"use client";

import type { FieldInputProps } from "../input-props";

export function BooleanInput({ field, value, onChange, required, disabled, error, flagged }: FieldInputProps) {
  // When the checkbox shares a grid row with labeled inputs (colSpan < 12), reserve
  // an empty label line above it and center it in an input-height row so it aligns
  // with the sibling inputs instead of their labels. A full-width boolean (no colSpan
  // or colSpan 12) sits on its own row and stays inline.
  const colSpan = field.config?.ui?.colSpan;
  const alignWithInputs = typeof colSpan === "number" && colSpan < 12;

  const control = (
    <label className={alignWithInputs ? "flex h-9 items-center gap-2" : "flex items-center gap-2"}>
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
        {flagged && (
          <span
            className="inline-block w-2 h-2 rounded-full bg-destructive ml-1 align-middle"
            title="Flagged"
          />
        )}
      </span>
      {error ? <span className="ms-2 text-[11px] text-red-500">{error}</span> : null}
    </label>
  );

  if (!alignWithInputs) return control;

  return (
    <div className="flex flex-col">
      <span aria-hidden className="invisible text-xs font-medium">&nbsp;</span>
      {control}
    </div>
  );
}
