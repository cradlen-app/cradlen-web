/**
 * Build the unified PATCH body for `/patients/:id/<specialty>-history`.
 *
 * Specialty-agnostic: drives entirely from the template's section/field
 * bindings + `is_repeatable` flag.
 *
 * Body shape:
 *   - Singleton sections write each field's value into a nested object
 *     resolved from the binding path (e.g. `gynecological_baseline.flow`).
 *   - Repeatable sections produce `body[section.code] = rows.map(row → ...)`.
 *     Each row mirrors the API shape (`{ id?, ...leaf_columns }`); the
 *     leaf-column name comes from each field's binding-path tail.
 *
 * Conventions matching the backend diff semantics:
 *   - A repeatable section's array is included only when the user touched
 *     it (added/edited/removed at least one row). Otherwise the key is
 *     omitted, so the server leaves the collection untouched.
 *   - Empty rows (no field values) are dropped from the array — a fresh
 *     "Add row" with nothing typed shouldn't create a server row.
 *   - Sending the section with an explicitly empty array (`[]`) clears the
 *     collection. Today the caller signals this via `touchedSections`; an
 *     empty-after-clear array still emits `[]` in the body.
 */

import { applyEffect } from "@/builder/rules/predicate.evaluator";
import type {
  ExecutionState,
  RepeatableRow,
} from "@/builder/runtime/TemplateExecutionContext";
import type {
  FormFieldDto,
  FormSectionDto,
  FormTemplateDto,
} from "@/builder/templates/template.types";

function setByPath(
  target: Record<string, unknown>,
  path: string,
  value: unknown,
): void {
  const keys = path.split(".");
  let cursor: Record<string, unknown> = target;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (typeof cursor[key] !== "object" || cursor[key] === null) {
      cursor[key] = {};
    }
    cursor = cursor[key] as Record<string, unknown>;
  }
  cursor[keys[keys.length - 1]] = value;
}

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function pathTail(path: string | null | undefined): string | null {
  if (!path) return null;
  const dot = path.lastIndexOf(".");
  return dot >= 0 ? path.slice(dot + 1) : path;
}

function evaluationContext(
  state: ExecutionState,
  rowValues?: Record<string, unknown>,
): Record<string, unknown> {
  return { ...state.systemValues, ...(rowValues ?? state.formValues) };
}

function isVisible(
  preds: ReturnType<typeof getSectionPredicates>,
  ctx: Record<string, unknown>,
) {
  return applyEffect(preds, "visible", ctx, true);
}

function getSectionPredicates(section: FormSectionDto) {
  return section.config?.logic?.predicates;
}

function getFieldPredicates(field: FormFieldDto) {
  return field.config?.logic?.predicates;
}

export interface BuildOptions {
  /**
   * Section codes whose repeatable arrays should appear in the body even
   * if empty. Use this to express "user explicitly removed all rows", so
   * the server soft-deletes any prior rows.
   */
  emitEmptySections?: ReadonlySet<string>;
}

export function buildPatientHistorySubmission(
  template: FormTemplateDto,
  state: ExecutionState,
  options: BuildOptions = {},
): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  const emitEmpty = options.emitEmptySections ?? new Set<string>();

  for (const section of template.sections) {
    // Section-level visibility predicates evaluated against the singleton
    // context (repeatable rows evaluate their own predicates per-row).
    const sectionCtx = evaluationContext(state);
    if (!isVisible(getSectionPredicates(section), sectionCtx)) continue;

    if (section.is_repeatable) {
      const rows = state.repeatableRows[section.code] ?? [];
      const apiRows = rows
        .map((row) => rowToApi(row, section.fields, state))
        .filter((apiRow) => apiRow !== null) as Array<Record<string, unknown>>;

      if (apiRows.length > 0) {
        body[section.code] = apiRows;
      } else if (emitEmpty.has(section.code)) {
        body[section.code] = [];
      }
      continue;
    }

    // Singleton section: each field writes into a nested object via its
    // binding path. Skip empty values to preserve unchanged-key semantics.
    for (const field of section.fields) {
      const fieldCtx = evaluationContext(state);
      if (!applyEffect(getFieldPredicates(field), "visible", fieldCtx, true)) {
        continue;
      }
      const ns = field.binding?.namespace;
      const path = field.binding?.path;
      if (!ns || !path) continue;
      if (ns === "SYSTEM" || ns === "COMPUTED") continue;

      const value = state.formValues[field.code];
      if (isEmpty(value)) continue;
      setByPath(body, path, value);
    }
  }

  return body;
}

function rowToApi(
  row: RepeatableRow,
  fields: FormFieldDto[],
  state: ExecutionState,
): Record<string, unknown> | null {
  const apiRow: Record<string, unknown> = {};
  const rowCtx = evaluationContext(state, row.values);

  for (const field of fields) {
    if (!applyEffect(getFieldPredicates(field), "visible", rowCtx, true)) continue;
    const ns = field.binding?.namespace;
    if (!ns || ns === "SYSTEM" || ns === "COMPUTED") continue;
    const tail = pathTail(field.binding?.path);
    if (!tail) continue;

    // For ENTITY_SEARCH fields: prefer the resolved entity's label as the
    // display value; if the user picked one, also emit the resolved id via
    // the paired idTarget field (whose own field-loop iteration handles it).
    const value = row.values[field.code];
    if (!isEmpty(value)) {
      apiRow[tail] = value;
    }
  }

  // Drop a row that the user added but never filled in (no real content).
  const hasContent = Object.keys(apiRow).length > 0;
  if (!hasContent && !row.id) return null;

  if (row.id) apiRow.id = row.id;
  return apiRow;
}