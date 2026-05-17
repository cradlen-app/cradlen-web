/**
 * Map a `PatientHistoryEnvelope` response into the
 * `TemplateExecutionContextProvider` initial-state shape.
 *
 * Specialty-agnostic: driven only by the template's section/field bindings
 * and `is_repeatable` flag. No OB/GYN-specific branches.
 */

import type { PatientHistoryEnvelope } from "../api/patient-history.api";
import type {
  FormFieldDto,
  FormTemplateDto,
} from "@/builder/templates/template.types";
import type {
  RepeatableRow,
  SearchEntry,
} from "@/builder/runtime/TemplateExecutionContext";

export interface InitialHistoryState {
  formValues: Record<string, unknown>;
  searchState: Record<string, SearchEntry>;
  repeatableRows: Record<string, RepeatableRow[]>;
}

function getByPath(source: unknown, path: string): unknown {
  if (!source || typeof source !== "object") return undefined;
  const keys = path.split(".");
  let cursor: unknown = source;
  for (const key of keys) {
    if (cursor && typeof cursor === "object" && key in cursor) {
      cursor = (cursor as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return cursor;
}

function newRowKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `row-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

function pathTail(path: string | null | undefined): string | null {
  if (!path) return null;
  const dot = path.lastIndexOf(".");
  return dot >= 0 ? path.slice(dot + 1) : path;
}

function emptySearch(): SearchEntry {
  return { transientValue: "", suggestions: [], resolvedEntityId: null };
}

export function toInitialHistoryState(
  envelope: PatientHistoryEnvelope,
  template: FormTemplateDto,
): InitialHistoryState {
  const formValues: Record<string, unknown> = {};
  const searchState: Record<string, SearchEntry> = {};
  const repeatableRows: Record<string, RepeatableRow[]> = {};

  for (const section of template.sections) {
    if (section.is_repeatable) {
      const arr = envelope[section.code];
      const trailingEmpty: RepeatableRow = { rowKey: newRowKey(), values: {} };
      if (!Array.isArray(arr)) {
        // No prior rows — start with one empty row ready for typing.
        repeatableRows[section.code] = [trailingEmpty];
        continue;
      }
      // Hydrated rows + one trailing empty row (matches the target UX).
      repeatableRows[section.code] = [
        ...arr.map((raw) =>
          rowFromApi(raw as Record<string, unknown>, section.fields),
        ),
        trailingEmpty,
      ];
      continue;
    }
    // Singleton section — pull each field's value by its binding path.
    for (const field of section.fields) {
      const path = field.binding?.path;
      if (!path) continue;
      const value = getByPath(envelope, path);
      if (value !== undefined && value !== null) {
        formValues[field.code] = value;
        if (
          field.type === "ENTITY_SEARCH" &&
          typeof value === "string" &&
          value.length > 0
        ) {
          // Singleton ENTITY_SEARCH fields aren't used by patient-history yet;
          // pre-fill the searchState transient so the input shows the value.
          searchState[field.code] = {
            ...emptySearch(),
            transientValue: value,
          };
        }
      }
    }
  }

  return { formValues, searchState, repeatableRows };
}

function rowFromApi(
  raw: Record<string, unknown>,
  fields: FormFieldDto[],
): RepeatableRow {
  const values: Record<string, unknown> = {};
  const rowSearchState: Record<string, SearchEntry> = {};
  for (const field of fields) {
    // Repeatable bindings look like `<resource>.<column>`; the leaf is the
    // API row's property.
    const tail = pathTail(field.binding?.path);
    if (!tail) continue;
    const v = raw[tail];
    if (v === undefined || v === null) continue;
    values[field.code] = v;
    // ENTITY_SEARCH fields with `ui.searchEntity.idTarget`: also pre-fill
    // the resolved entity so the input shows the picked label.
    const searchEntity = field.config?.ui?.searchEntity;
    if (field.type === "ENTITY_SEARCH" && searchEntity?.idTarget) {
      const idTarget = searchEntity.idTarget;
      // Find the sibling field bound to the id column.
      const idField = fields.find((f) => f.code === idTarget);
      const idPathTail = pathTail(idField?.binding?.path);
      const idValue = idPathTail ? raw[idPathTail] : undefined;
      if (typeof idValue === "string" && idValue.length > 0 && typeof v === "string") {
        rowSearchState[field.code] = {
          transientValue: v,
          suggestions: [],
          resolvedEntityId: { id: idValue, label: v },
        };
      }
    }
  }
  const id = typeof raw.id === "string" ? raw.id : undefined;
  return {
    rowKey: newRowKey(),
    id,
    values,
    searchState: Object.keys(rowSearchState).length > 0 ? rowSearchState : undefined,
  };
}