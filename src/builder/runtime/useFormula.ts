"use client";

import { useEffect } from "react";
import type { FormFieldDto } from "../templates/template.types";
import { useTemplateExecution } from "./TemplateExecutionContext";

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Evaluates a small set of known COMPUTED formulas. Today only `bmi`; add
 * cases here as the catalog grows (or swap for a generic expression
 * evaluator once a second formula lands).
 */
function evaluateFormula(
  formula: string | undefined,
  inputs: Record<string, number | null>,
): number | null {
  if (!formula) return null;

  // BMI: weight_kg / ((height_cm / 100) ^ 2)
  if (formula.includes("weight_kg") && formula.includes("height_cm")) {
    const w = inputs.weight_kg;
    const h = inputs.height_cm;
    if (w === null || h === null || h <= 0) return null;
    const meters = h / 100;
    const bmi = w / (meters * meters);
    return Math.round(bmi * 10) / 10;
  }

  return null;
}

/**
 * Subscribes a single COMPUTED field to its inputs and writes the recomputed
 * value into formValues whenever an input changes. Submission builder skips
 * COMPUTED values, so this is purely for display.
 */
export function useComputedField(field: FormFieldDto): unknown {
  const { state, setFieldValue } = useTemplateExecution();
  const derivedFrom = (field.config?.ui?.derivedFrom as string[] | undefined) ?? [];
  const formula = field.config?.logic?.formula as string | undefined;

  const inputs: Record<string, number | null> = {};
  for (const code of derivedFrom) {
    inputs[code] = toNumber(state.formValues[code]);
  }

  const computed = evaluateFormula(formula, inputs);

  useEffect(() => {
    if (state.formValues[field.code] !== computed) {
      setFieldValue(field.code, computed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computed]);

  return computed;
}
