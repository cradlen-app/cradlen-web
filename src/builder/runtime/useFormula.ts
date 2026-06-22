"use client";

import { useEffect } from "react";
import type { FormFieldDto } from "../templates/template.types";
import { useTemplateExecution } from "./TemplateExecutionContext";

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

const MS_PER_DAY = 86_400_000;
const FULL_TERM_DAYS = 280;

/** Day number at UTC midnight, or null. Mirrors the server `ga.util.ts`. */
function utcDay(value: unknown): number | null {
  if (value instanceof Date) {
    return Math.floor(
      Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()) /
        MS_PER_DAY,
    );
  }
  if (typeof value === "string" && value.trim() !== "") {
    const d = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
    if (Number.isNaN(d.getTime())) return null;
    return Math.floor(d.getTime() / MS_PER_DAY);
  }
  return null;
}

function todayUtcDay(): number {
  return Math.floor(Date.now() / MS_PER_DAY);
}

function formatGa(totalDays: number): string {
  const clamped = totalDays < 0 ? 0 : totalDays;
  return `${Math.floor(clamped / 7)}w ${clamped % 7}d`;
}

function isoDate(dayNumber: number): string {
  return new Date(dayNumber * MS_PER_DAY).toISOString().slice(0, 10);
}

function usAgeDays(inputs: Record<string, unknown>): number | null {
  const w = toNumber(inputs.us_ga_weeks);
  const d = toNumber(inputs.us_ga_days);
  if (w === null && d === null) return null;
  return (w ?? 0) * 7 + (d ?? 0);
}

/**
 * Evaluates the known COMPUTED formulas. Numeric (BMI) plus the pregnancy
 * date math (GA/EDD from LMP and from US dating), which must agree with the
 * server `ga.util.ts`. GA returns "Xw Yd"; EDD returns "YYYY-MM-DD".
 */
export function evaluateFormula(
  formula: string | undefined,
  inputs: Record<string, unknown>,
): string | number | null {
  if (!formula) return null;

  // BMI: weight_kg / ((height_cm / 100) ^ 2)
  if (formula.includes("weight_kg") && formula.includes("height_cm")) {
    const w = toNumber(inputs.weight_kg);
    const h = toNumber(inputs.height_cm);
    if (w === null || h === null || h <= 0) return null;
    const meters = h / 100;
    return Math.round((w / (meters * meters)) * 10) / 10;
  }

  if (formula === "ga_from_lmp") {
    const lmp = utcDay(inputs.lmp);
    return lmp === null ? null : formatGa(todayUtcDay() - lmp);
  }
  if (formula === "edd_from_lmp") {
    const lmp = utcDay(inputs.lmp);
    return lmp === null ? null : isoDate(lmp + FULL_TERM_DAYS);
  }
  if (formula === "ga_from_us") {
    const usDay = utcDay(inputs.us_dating_date);
    const ageDays = usAgeDays(inputs);
    if (usDay === null || ageDays === null) return null;
    return formatGa(ageDays + (todayUtcDay() - usDay));
  }
  if (formula === "edd_from_us") {
    const usDay = utcDay(inputs.us_dating_date);
    const ageDays = usAgeDays(inputs);
    if (usDay === null || ageDays === null) return null;
    return isoDate(usDay + (FULL_TERM_DAYS - ageDays));
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
  const derivedFrom =
    (field.config?.ui?.derivedFrom as string[] | undefined) ?? [];
  const formula = field.config?.logic?.formula as string | undefined;

  const inputs: Record<string, unknown> = {};
  for (const code of derivedFrom) {
    inputs[code] = state.formValues[code];
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
