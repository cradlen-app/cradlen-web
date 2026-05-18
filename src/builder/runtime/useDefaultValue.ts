"use client";

import { useEffect } from "react";
import { useFieldValue, useSetFieldValue } from "./useFieldState";
import type { FieldOption, FormFieldDto } from "../templates/template.types";

function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

/**
 * Applies `field.config.ui.default` whenever the field is empty. Fires after
 * every render where the field has no value so defaults re-apply correctly
 * after a discriminator reset wipes formValues. User-entered or pre-filled
 * values are never overwritten (isEmpty guard).
 */
export function useDefaultValue(
  field: FormFieldDto,
  resolvedOptions: ReadonlyArray<FieldOption>,
): void {
  const def = field.config?.ui?.default;
  const value = useFieldValue(field.code);
  const setFieldValue = useSetFieldValue();

  useEffect(() => {
    if (def === undefined) return;
    if (!isEmpty(value)) return;

    if (typeof def === "object" && def !== null && "kind" in def) {
      if (def.kind === "first_option") {
        const first = resolvedOptions[0];
        if (!first) return;
        setFieldValue(field.code, first.code);
      } else if (def.kind === "now") {
        // Emit the local-time format that `<input type="datetime-local">` and
        // `<input type="date">` consume: `YYYY-MM-DDTHH:mm` or `YYYY-MM-DD`.
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, "0");
        const ymd = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        const v =
          field.type === "DATE"
            ? ymd
            : `${ymd}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
        setFieldValue(field.code, v);
      }
      return;
    }

    setFieldValue(field.code, def);
  }, [def, value, resolvedOptions, field.code, field.type, setFieldValue]);
}
