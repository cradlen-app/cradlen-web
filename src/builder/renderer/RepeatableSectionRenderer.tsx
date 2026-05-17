"use client";

import { useEffect } from "react";
import { RepeatableRowScope, useTemplateExecution } from "../runtime/TemplateExecutionContext";
import { FieldRenderer } from "./FieldRenderer";
import type { FormSectionDto } from "../templates/template.types";

interface Props {
  section: FormSectionDto;
  errors?: Record<string, string>;
}

/**
 * Renders one row per `RepeatableRow` plus an "Add row" button. Each row is
 * a `<RepeatableRowScope>` that re-publishes the execution context with
 * row-scoped field reads/writes, so `FieldRenderer` works unchanged.
 *
 * If the section has no rows on first render, seed one blank row so the
 * user has something to type into.
 */
export function RepeatableSectionRenderer({ section, errors }: Props) {
  const { getRepeatableRows, addRepeatableRow, removeRepeatableRow } =
    useTemplateExecution();
  const rows = getRepeatableRows(section.code);

  useEffect(() => {
    if (rows.length === 0) {
      addRepeatableRow(section.code);
    }
    // Intentionally fire-and-forget on mount; we only want to seed once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sortedFields = [...section.fields].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-4">
      {rows.map((row, idx) => (
        <div
          key={row.rowKey}
          className="space-y-3 rounded-lg border border-gray-100 p-3"
        >
          <div className="flex items-center justify-between text-[11px] text-gray-400">
            <span>#{idx + 1}</span>
            {rows.length > 1 && (
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
              {sortedFields.map((field) => (
                <FieldRenderer
                  key={field.id}
                  field={field}
                  error={errors?.[`${section.code}.${idx}.${field.code}`]}
                />
              ))}
            </div>
          </RepeatableRowScope>
        </div>
      ))}
      <button
        type="button"
        onClick={() => addRepeatableRow(section.code)}
        className="text-xs font-medium text-brand-primary hover:underline"
      >
        + Add row
      </button>
    </div>
  );
}