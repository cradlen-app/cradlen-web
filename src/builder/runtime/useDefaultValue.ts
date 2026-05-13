"use client";

import { useEffect, useRef } from "react";
import { useFieldValue, useSetFieldValue } from "./useFieldState";
import type { FieldOption, FormFieldDto } from "../templates/template.types";

function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

/**
 * Applies `field.config.ui.default` once per field, only when the field is
 * empty. Literal defaults fire on mount; `{ kind: "first_option" }` fires once
 * the resolved options list contains entries. User-entered values are never
 * overwritten.
 */
export function useDefaultValue(
  field: FormFieldDto,
  resolvedOptions: ReadonlyArray<FieldOption>,
): void {
  const def = field.config?.ui?.default;
  const value = useFieldValue(field.code);
  const setFieldValue = useSetFieldValue();
  const appliedRef = useRef(false);

  useEffect(() => {
    if (appliedRef.current) return;
    if (def === undefined) return;
    if (!isEmpty(value)) {
      // Field was already populated (e.g. from a prior session) — leave it.
      appliedRef.current = true;
      return;
    }

    if (typeof def === "object" && def !== null && "kind" in def) {
      if (def.kind === "first_option") {
        const first = resolvedOptions[0];
        if (!first) return;
        setFieldValue(field.code, first.code);
        appliedRef.current = true;
      }
      return;
    }

    setFieldValue(field.code, def);
    appliedRef.current = true;
  }, [def, value, resolvedOptions, field.code, setFieldValue]);
}
