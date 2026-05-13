"use client";

import { fieldClass, FieldShell } from "../field-shell";
import { useComputedField } from "../../runtime/useFormula";
import type { FieldInputProps } from "../input-props";

export function ComputedInput({ field, required, error }: FieldInputProps) {
  const computed = useComputedField(field);
  const display =
    computed === null || computed === undefined ? "—" : String(computed);
  return (
    <FieldShell label={field.label} required={required} error={error}>
      <input
        type="text"
        value={display}
        readOnly
        tabIndex={-1}
        className={`${fieldClass} cursor-default text-gray-500`}
      />
    </FieldShell>
  );
}
