/**
 * Build the unified PATCH body for a template-driven endpoint such as
 * `/patients/:id/<specialty>-history` or `/visits/:id/<specialty>-examination`.
 *
 * Specialty-agnostic: drives entirely from the template's section/field
 * bindings + `is_repeatable` flag. Originally lived under
 * `features/patient-history/lib/history-submission.ts`; moved here so
 * other features (Examination tab, future specialty tabs) can call it
 * without depending on the history feature.
 *
 * Body shape:
 *   - Singleton sections write each field's value into a nested object
 *     resolved from the binding path (e.g. `gynecological_baseline.flow`).
 *   - Repeatable sections produce `body[section.code] = rows.map(row → ...)`.
 *     Each row mirrors the API shape (`{ id?, ...leaf_columns }`); the
 *     leaf-column name comes from each field's binding-path tail.
 *
 * Conventions matching backend diff semantics:
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
  BindingNamespace,
  FormFieldDto,
  FormSectionDto,
  FormTemplateDto,
} from "@/builder/templates/template.types";

/** The segment(s) before the binding path's tail (the repeatable collection
 *  key), or null when the path is a single segment. e.g. `allergies.allergy_to`
 *  → `allergies`; `custom_test_name` → null. */
function pathHead(path: string | null | undefined): string | null {
  if (!path) return null;
  const dot = path.lastIndexOf(".");
  return dot > 0 ? path.slice(0, dot) : null;
}

type NamespaceContainers = Partial<Record<BindingNamespace, string>>;

/** The body container key for a section (from the first bound field's
 *  namespace), or undefined to write at the body root. */
function sectionContainer(
  section: FormSectionDto,
  containers: NamespaceContainers,
): string | undefined {
  for (const f of section.fields) {
    const ns = f.binding?.namespace;
    if (ns && containers[ns]) return containers[ns];
  }
  return undefined;
}

/** The array key for a repeatable section under its container: the binding-path
 *  head of the first bound field, falling back to the section code. */
function repeatableArrayKey(section: FormSectionDto): string {
  for (const f of section.fields) {
    const head = pathHead(f.binding?.path);
    if (head) return head;
  }
  return section.code;
}

function containerTarget(
  body: Record<string, unknown>,
  container: string | undefined,
): Record<string, unknown> {
  if (!container) return body;
  if (typeof body[container] !== "object" || body[container] === null) {
    body[container] = {};
  }
  return body[container] as Record<string, unknown>;
}

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
  /**
   * Map a binding namespace to a body container key. Fields/sections of that
   * namespace are nested under `body[container]` instead of the body root.
   * Used by composite surfaces (e.g. the OB/GYN examination nests
   * `PATIENT_OBGYN_HISTORY` under `obgyn_history`). Default: write at root.
   */
  namespaceContainers?: NamespaceContainers;
  /**
   * Section codes to skip entirely (e.g. history sections not relevant to the
   * selected care path). Keeps render + submit consistent.
   */
  excludeSectionCodes?: ReadonlySet<string>;
}

export function buildTemplateSubmission(
  template: FormTemplateDto,
  state: ExecutionState,
  options: BuildOptions = {},
): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  const emitEmpty = options.emitEmptySections ?? new Set<string>();
  const containers = options.namespaceContainers ?? {};
  const exclude = options.excludeSectionCodes ?? new Set<string>();

  for (const section of template.sections) {
    if (exclude.has(section.code)) continue;
    // Section-level visibility predicates evaluated against the singleton
    // context (repeatable rows evaluate their own predicates per-row).
    const sectionCtx = evaluationContext(state);
    if (!isVisible(getSectionPredicates(section), sectionCtx)) continue;

    if (section.is_repeatable) {
      const rows = state.repeatableRows[section.code] ?? [];
      const apiRows = rows
        .map((row) => rowToApi(row, section.fields, state))
        .filter((apiRow) => apiRow !== null) as Array<Record<string, unknown>>;

      const target = containerTarget(body, sectionContainer(section, containers));
      const arrayKey = repeatableArrayKey(section);
      if (apiRows.length > 0) {
        target[arrayKey] = apiRows;
      } else if (emitEmpty.has(section.code)) {
        target[arrayKey] = [];
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
      setByPath(containerTarget(body, containers[ns]), path, value);
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

    const value = row.values[field.code];
    if (!isEmpty(value)) {
      apiRow[tail] = value;
    }
  }

  const hasContent = Object.keys(apiRow).length > 0;
  if (!hasContent && !row.id) return null;

  if (row.id) apiRow.id = row.id;
  return apiRow;
}
