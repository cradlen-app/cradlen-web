"use client";

import { useEffect, useMemo } from "react";
import { RepeatableRowScope, useTemplateExecution } from "../runtime/TemplateExecutionContext";
import { FieldRenderer } from "./FieldRenderer";
import type { FormSectionDto } from "../templates/template.types";

interface Props {
  section: FormSectionDto;
  errors?: Record<string, string>;
  /** Render rows as static text — no add/remove, no auto-append empty row. */
  displayOnly?: boolean;
  /** The whole template is a frozen snapshot (forwarded to each field). */
  hardReadOnly?: boolean;
}

function isEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function rowHasAnyValue(values: Record<string, unknown>): boolean {
  for (const v of Object.values(values)) {
    if (!isEmptyValue(v)) return true;
  }
  return false;
}

/**
 * Renders one row per `RepeatableRow` plus an "Add row" button. Each row is
 * a `<RepeatableRowScope>` that re-publishes the execution context with
 * row-scoped field reads/writes, so `FieldRenderer` works unchanged.
 *
 * Two row-lifecycle behaviours:
 *   1. Seed a single empty row on mount when the section has none.
 *   2. Auto-append an empty row as soon as the LAST row picks up any value,
 *      so the doctor never has to click "+ Add row" mid-flow. The submission
 *      builder drops content-free trailing rows, so the auto-row is invisible
 *      to the API.
 */
export function RepeatableSectionRenderer({
  section,
  errors,
  displayOnly = false,
  hardReadOnly = false,
}: Props) {
  const { getRepeatableRows, addRepeatableRow, removeRepeatableRow } =
    useTemplateExecution();
  const rows = getRepeatableRows(section.code);

  useEffect(() => {
    if (displayOnly) return;
    if (rows.length === 0) {
      addRepeatableRow(section.code);
    }
    // Intentionally fire-and-forget on mount; we only want to seed once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayOnly]);

  useEffect(() => {
    if (displayOnly) return;
    if (rows.length === 0) return;
    const last = rows[rows.length - 1];
    if (rowHasAnyValue(last.values)) {
      addRepeatableRow(section.code);
    }
  }, [rows, section.code, addRepeatableRow, displayOnly]);

  const sortedFields = useMemo(
    () => [...section.fields].sort((a, b) => a.order - b.order),
    [section.fields],
  );

  // Drop the resolved-id sibling fields of any ENTITY_SEARCH (e.g. medication_id,
  // diagnosis_code). They're populated invisibly on pick and still submitted —
  // they must never render as empty inputs (edit) or raw UUIDs (read-only).
  const idTargets = useMemo(() => {
    const set = new Set<string>();
    for (const f of section.fields) {
      const target = f.config?.ui?.searchEntity?.idTarget;
      if (typeof target === "string") set.add(target);
    }
    return set;
  }, [section.fields]);

  const fieldsToRender = sortedFields.filter((f) => !idTargets.has(f.code));
  const visibleRows = displayOnly
    ? rows.filter((r) => rowHasAnyValue(r.values))
    : rows;

  if (displayOnly && visibleRows.length === 0) {
    return <p className="text-xs text-gray-400">—</p>;
  }

  return (
    <div className="space-y-4">
      {visibleRows.map((row, idx) => (
        <div
          key={row.rowKey}
          className="space-y-3 rounded-lg border border-gray-100 p-3"
        >
          <div className="flex items-center justify-between text-[11px] text-gray-400">
            <span>#{idx + 1}</span>
            {!displayOnly && rows.length > 1 && (
              <button
                type="button"
                onClick={() => removeRepeatableRow(section.code, row.rowKey)}
                className="text-red-500 hover:underline"
              >
                Remove
              </button>
            )}
          </div>
          <RepeatableRowScope sectionCode={section.code} rowKey={row.rowKey}>
            <div className="grid grid-cols-12 gap-x-6 gap-y-3">
              {fieldsToRender.map((field) => (
                <FieldRenderer
                  key={field.id}
                  field={field}
                  displayOnly={displayOnly}
                  hardReadOnly={hardReadOnly}
                  error={errors?.[`${section.code}.${idx}.${field.code}`]}
                />
              ))}
            </div>
          </RepeatableRowScope>
        </div>
      ))}
      {!displayOnly && (
        <button
          type="button"
          onClick={() => addRepeatableRow(section.code)}
          className="text-xs font-medium text-brand-primary hover:underline"
        >
          + Add row
        </button>
      )}
    </div>
  );
}
