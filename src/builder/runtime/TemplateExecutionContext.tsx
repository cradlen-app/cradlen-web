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

export interface ExecutionState {
  formValues: Record<string, unknown>;
  searchState: Record<string, SearchEntry>;
  systemValues: Record<string, unknown>;
}

type Action =
  | { type: "set_field"; code: string; value: unknown }
  | { type: "set_system"; code: string; value: unknown }
  | { type: "patch_search"; code: string; patch: Partial<SearchEntry> }
  | { type: "reset_after_discriminator"; preserveSystem: Record<string, unknown> };

function blankSearchEntry(): SearchEntry {
  return { transientValue: "", suggestions: [], resolvedEntityId: null };
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
}

const ExecutionContext = createContext<ExecutionContextValue | null>(null);

interface ProviderProps {
  template: FormTemplateDto;
  initialSystemValues?: Record<string, unknown>;
  initialFormValues?: Record<string, unknown>;
  initialSearchState?: Record<string, SearchEntry>;
  children: ReactNode;
}

export function TemplateExecutionContextProvider({
  template,
  initialSystemValues = {},
  initialFormValues = {},
  initialSearchState = {},
  children,
}: ProviderProps) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    formValues: initialFormValues,
    searchState: initialSearchState,
    systemValues: initialSystemValues,
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
