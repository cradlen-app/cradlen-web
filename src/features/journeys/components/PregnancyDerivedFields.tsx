"use client";

import { useEffect } from "react";
import { useTemplateExecution } from "@/builder/runtime/TemplateExecutionContext";

/** Named-type → fetus count. Higher-order is entered manually (no mapping). */
const FETUS_COUNT: Record<string, number> = {
  SINGLETON: 1,
  TWINS: 2,
  TRIPLETS: 3,
};
const MULTIPLE_TYPES = new Set(["TWINS", "TRIPLETS", "HIGHER_ORDER"]);

/**
 * Pregnancy-specific reactive logic, mounted inside the journey form's execution
 * context (only when the care path is OBGYN_PREGNANCY). When pregnancy_type
 * changes it auto-sets number_of_fetuses (except Higher-order) and nudges
 * risk_level to High for multiples — but only when risk is unset/Normal, so the
 * doctor's explicit choice is never overridden. Renders nothing.
 */
export function PregnancyDerivedFields() {
  const { state, setFieldValue } = useTemplateExecution();
  const pregnancyType = state.formValues.pregnancy_type as string | undefined;

  useEffect(() => {
    if (!pregnancyType) return;

    const mappedCount = FETUS_COUNT[pregnancyType];
    if (
      mappedCount !== undefined &&
      state.formValues.number_of_fetuses !== mappedCount
    ) {
      setFieldValue("number_of_fetuses", mappedCount);
    }

    const risk = state.formValues.risk_level;
    if (
      MULTIPLE_TYPES.has(pregnancyType) &&
      (risk == null || risk === "" || risk === "NORMAL")
    ) {
      setFieldValue("risk_level", "HIGH");
    }
    // Fire only when the type changes; reads current count/risk from closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pregnancyType]);

  return null;
}
