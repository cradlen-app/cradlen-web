"use client";

import { createContext, useContext, useMemo, useReducer } from "react";
import type { ReactNode } from "react";
import type { EntityResult } from "../fields/entity.registry";
import type { FormTemplateDto } from "../templates/template.types";

export interface SearchEntry {
  transientValue: string;
  suggestions: EntityResult[];
  resolvedEntityId: { id: string; label: string } | null;
}

export interface RepeatableRow {
  /** Stable client-side key (uuid-ish) for React. */
  rowKey: string;
  /** Server id if loaded from the API; absent for newly-added rows. */
  id?: string;
  /** field.code → value, scoped to this row. */
  values: Record<string, unknown>;
  /** Per-field search state (ENTITY_SEARCH inside repeatable sections). */
  searchState?: Record<string, SearchEntry>;
}

export interface ExecutionState {
  formValues: Record<string, unknown>;
  searchState: Record<string, SearchEntry>;
  systemValues: Record<string, unknown>;
  /** Rows per repeatable section, keyed by section.code. */
  repeatableRows: Record<string, RepeatableRow[]>;
}

type Action =
  | { type: "set_field"; code: string; value: unknown }
  | { type: "set_system"; code: string; value: unknown }
  | { type: "patch_search"; code: string; patch: Partial<SearchEntry> }
  | {
      type: "reset_after_discriminator";
      preserveSystem: Record<string, unknown>;
    }
  | { type: "repeatable_add_row"; sectionCode: string; rowKey: string }
  | {
      type: "repeatable_remove_row";
      sectionCode: string;
      rowKey: string;
    }
  | {
      type: "repeatable_set_field";
      sectionCode: string;
      rowKey: string;
      fieldCode: string;
      value: unknown;
    }
  | {
      type: "repeatable_patch_search";
      sectionCode: string;
      rowKey: string;
      fieldCode: string;
      patch: Partial<SearchEntry>;
    }
  | {
      type: "repeatable_replace_all";
      sectionCode: string;
      rows: RepeatableRow[];
    };

function blankSearchEntry(): SearchEntry {
  return { transientValue: "", suggestions: [], resolvedEntityId: null };
}

function newRowKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `row-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

function reducer(state: ExecutionState, action: Action): ExecutionState {
  switch (action.type) {
    case "set_field":
      return {
        ...state,
        formValues: { ...state.formValues, [action.code]: action.value },
      };
    case "set_system":
      return {
        ...state,
        systemValues: { ...state.systemValues, [action.code]: action.value },
      };
    case "patch_search": {
      const prev = state.searchState[action.code] ?? blankSearchEntry();
      return {
        ...state,
        searchState: {
          ...state.searchState,
          [action.code]: { ...prev, ...action.patch },
        },
      };
    }
    case "reset_after_discriminator":
      return {
        formValues: {},
        searchState: {},
        systemValues: action.preserveSystem,
        repeatableRows: {},
      };
    case "repeatable_add_row": {
      const rows = state.repeatableRows[action.sectionCode] ?? [];
      const next: RepeatableRow = { rowKey: action.rowKey, values: {} };
      return {
        ...state,
        repeatableRows: {
          ...state.repeatableRows,
          [action.sectionCode]: [...rows, next],
        },
      };
    }
    case "repeatable_remove_row": {
      const rows = state.repeatableRows[action.sectionCode] ?? [];
      return {
        ...state,
        repeatableRows: {
          ...state.repeatableRows,
          [action.sectionCode]: rows.filter((r) => r.rowKey !== action.rowKey),
        },
      };
    }
    case "repeatable_set_field": {
      const rows = state.repeatableRows[action.sectionCode] ?? [];
      return {
        ...state,
        repeatableRows: {
          ...state.repeatableRows,
          [action.sectionCode]: rows.map((r) =>
            r.rowKey === action.rowKey
              ? { ...r, values: { ...r.values, [action.fieldCode]: action.value } }
              : r,
          ),
        },
      };
    }
    case "repeatable_patch_search": {
      const rows = state.repeatableRows[action.sectionCode] ?? [];
      return {
        ...state,
        repeatableRows: {
          ...state.repeatableRows,
          [action.sectionCode]: rows.map((r) => {
            if (r.rowKey !== action.rowKey) return r;
            const prevSearch = r.searchState?.[action.fieldCode] ?? blankSearchEntry();
            return {
              ...r,
              searchState: {
                ...(r.searchState ?? {}),
                [action.fieldCode]: { ...prevSearch, ...action.patch },
              },
            };
          }),
        },
      };
    }
    case "repeatable_replace_all":
      return {
        ...state,
        repeatableRows: {
          ...state.repeatableRows,
          [action.sectionCode]: action.rows,
        },
      };
  }
}

interface ExecutionContextValue {
  state: ExecutionState;
  template: FormTemplateDto;
  fieldNamespaceByCode: Record<string, string | null>;
  systemFieldCodes: ReadonlySet<string>;
  setFieldValue: (code: string, value: unknown) => void;
  patchSearch: (code: string, patch: Partial<SearchEntry>) => void;
  resetAfterDiscriminator: (preserveSystem: Record<string, unknown>) => void;
  // Repeatable-row methods (no-ops in row scopes — only the outer provider drives mutations).
  addRepeatableRow: (sectionCode: string) => string;
  removeRepeatableRow: (sectionCode: string, rowKey: string) => void;
  setRepeatableFieldValue: (
    sectionCode: string,
    rowKey: string,
    fieldCode: string,
    value: unknown,
  ) => void;
  patchRepeatableSearch: (
    sectionCode: string,
    rowKey: string,
    fieldCode: string,
    patch: Partial<SearchEntry>,
  ) => void;
  replaceRepeatableRows: (sectionCode: string, rows: RepeatableRow[]) => void;
  getRepeatableRows: (sectionCode: string) => RepeatableRow[];
}

const ExecutionContext = createContext<ExecutionContextValue | null>(null);

interface ProviderProps {
  template: FormTemplateDto;
  initialSystemValues?: Record<string, unknown>;
  initialFormValues?: Record<string, unknown>;
  initialSearchState?: Record<string, SearchEntry>;
  initialRepeatableRows?: Record<string, RepeatableRow[]>;
  children: ReactNode;
}

export function TemplateExecutionContextProvider({
  template,
  initialSystemValues = {},
  initialFormValues = {},
  initialSearchState = {},
  initialRepeatableRows = {},
  children,
}: ProviderProps) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    formValues: initialFormValues,
    searchState: initialSearchState,
    systemValues: initialSystemValues,
    repeatableRows: initialRepeatableRows,
  }));

  const { fieldNamespaceByCode, systemFieldCodes } = useMemo(() => {
    const ns: Record<string, string | null> = {};
    const sys = new Set<string>();
    for (const section of template.sections) {
      for (const field of section.fields) {
        const namespace = field.binding?.namespace ?? null;
        ns[field.code] = namespace;
        if (namespace === "SYSTEM") sys.add(field.code);
      }
    }
    return { fieldNamespaceByCode: ns, systemFieldCodes: sys };
  }, [template]);

  const value = useMemo<ExecutionContextValue>(
    () => ({
      state,
      template,
      fieldNamespaceByCode,
      systemFieldCodes,
      setFieldValue: (code, v) => {
        if (systemFieldCodes.has(code)) {
          dispatch({ type: "set_system", code, value: v });
        } else {
          dispatch({ type: "set_field", code, value: v });
        }
      },
      patchSearch: (code, patch) => dispatch({ type: "patch_search", code, patch }),
      resetAfterDiscriminator: (preserveSystem) =>
        dispatch({ type: "reset_after_discriminator", preserveSystem }),
      addRepeatableRow: (sectionCode) => {
        const rowKey = newRowKey();
        dispatch({ type: "repeatable_add_row", sectionCode, rowKey });
        return rowKey;
      },
      removeRepeatableRow: (sectionCode, rowKey) =>
        dispatch({ type: "repeatable_remove_row", sectionCode, rowKey }),
      setRepeatableFieldValue: (sectionCode, rowKey, fieldCode, v) =>
        dispatch({
          type: "repeatable_set_field",
          sectionCode,
          rowKey,
          fieldCode,
          value: v,
        }),
      patchRepeatableSearch: (sectionCode, rowKey, fieldCode, patch) =>
        dispatch({
          type: "repeatable_patch_search",
          sectionCode,
          rowKey,
          fieldCode,
          patch,
        }),
      replaceRepeatableRows: (sectionCode, rows) =>
        dispatch({ type: "repeatable_replace_all", sectionCode, rows }),
      getRepeatableRows: (sectionCode) => state.repeatableRows[sectionCode] ?? [],
    }),
    [state, template, fieldNamespaceByCode, systemFieldCodes],
  );

  return <ExecutionContext.Provider value={value}>{children}</ExecutionContext.Provider>;
}

export function useTemplateExecution(): ExecutionContextValue {
  const ctx = useContext(ExecutionContext);
  if (!ctx) {
    throw new Error(
      "useTemplateExecution must be used inside <TemplateExecutionContextProvider>",
    );
  }
  return ctx;
}

export function useEvaluationContext(): Record<string, unknown> {
  const { state } = useTemplateExecution();
  return useMemo(
    () => ({ ...state.systemValues, ...state.formValues }),
    [state.systemValues, state.formValues],
  );
}

/**
 * Re-publishes the execution context for one row of a repeatable section.
 * Field readers (`useFieldValue`) see the row's values; setters write into
 * the row. The outer provider's methods (`addRepeatableRow`, …) are still
 * reachable because we keep the original methods on the scoped value, only
 * `state` + `setFieldValue` + `patchSearch` are swapped.
 */
interface RowScopeProps {
  sectionCode: string;
  rowKey: string;
  children: ReactNode;
}

export function RepeatableRowScope({ sectionCode, rowKey, children }: RowScopeProps) {
  const parent = useTemplateExecution();
  const row = useMemo(
    () =>
      (parent.state.repeatableRows[sectionCode] ?? []).find(
        (r) => r.rowKey === rowKey,
      ) ?? { rowKey, values: {}, searchState: {} },
    [parent.state.repeatableRows, sectionCode, rowKey],
  );

  const scoped = useMemo<ExecutionContextValue>(
    () => ({
      ...parent,
      state: {
        ...parent.state,
        formValues: row.values,
        searchState: row.searchState ?? {},
      },
      setFieldValue: (code, v) =>
        parent.setRepeatableFieldValue(sectionCode, rowKey, code, v),
      patchSearch: (code, patch) =>
        parent.patchRepeatableSearch(sectionCode, rowKey, code, patch),
    }),
    [parent, row, sectionCode, rowKey],
  );

  return <ExecutionContext.Provider value={scoped}>{children}</ExecutionContext.Provider>;
}