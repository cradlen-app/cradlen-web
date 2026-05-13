"use client";

import { useTemplateExecution, type SearchEntry } from "./TemplateExecutionContext";

const EMPTY: SearchEntry = {
  transientValue: "",
  suggestions: [],
  resolvedEntityId: null,
};

export function useSearchEntry(code: string): SearchEntry {
  const { state } = useTemplateExecution();
  return state.searchState[code] ?? EMPTY;
}

export function usePatchSearch() {
  const { patchSearch } = useTemplateExecution();
  return patchSearch;
}
