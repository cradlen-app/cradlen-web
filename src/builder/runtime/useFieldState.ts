"use client";

import { useTemplateExecution } from "./TemplateExecutionContext";

export function useFieldValue(code: string): unknown {
  const { state, systemFieldCodes } = useTemplateExecution();
  return systemFieldCodes.has(code)
    ? state.systemValues[code]
    : state.formValues[code];
}

export function useSetFieldValue() {
  const { setFieldValue } = useTemplateExecution();
  return setFieldValue;
}
