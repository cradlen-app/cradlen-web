"use client";

import { cn } from "@/common/utils/utils";
import { fieldClass, FieldShell } from "../field-shell";
import { useComputedField } from "../../runtime/useFormula";
import type { FieldInputProps } from "../input-props";

export function ComputedInput({ field, required, error }: FieldInputProps) {
  const computed = useComputedField(field);
  const display =
    computed === null || computed === undefined ? "—" : String(computed);
  const suffix = field.config?.ui?.suffix as string | undefined;
  const input = (
    <input
      type="text"
      value={display}
      readOnly
      tabIndex={-1}
      className={cn(fieldClass, "cursor-default text-gray-500", suffix && "pr-10")}
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
}
