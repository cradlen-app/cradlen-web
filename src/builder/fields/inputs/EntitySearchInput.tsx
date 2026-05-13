"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { cn } from "@/common/utils/utils";
import { fieldClass, FieldShell } from "../field-shell";
import { getEntitySearchFn, type EntityResult } from "../entity.registry";
import { useSearchEntry, usePatchSearch } from "../../runtime/useSearchState";
import { useSetFieldValue } from "../../runtime/useFieldState";
import type { FieldInputProps } from "../input-props";

export function EntitySearchInput({
  field,
  required,
  disabled,
  error,
}: FieldInputProps) {
  const searchEntity = field.config?.ui?.searchEntity;
  const entityKind =
    searchEntity?.kind ?? (field.config?.logic?.entity as string | undefined);
  const idTarget = searchEntity?.idTarget;
  const fillFields = searchEntity?.fillFields;
  const placeholder = (field.config?.ui?.placeholder as string | undefined) ?? "Search…";
  const setFieldValue = useSetFieldValue();

  const entry = useSearchEntry(field.code);
  const patchSearch = usePatchSearch();
  const [open, setOpen] = useState(false);
  const [debounced, setDebounced] = useState(entry.transientValue);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Debounce 300ms (matches usePatientSearch pattern).
  useEffect(() => {
    const id = setTimeout(() => setDebounced(entry.transientValue), 300);
    return () => clearTimeout(id);
  }, [entry.transientValue]);

  // Fetch suggestions when the debounced query is meaningful and no entity is
  // already resolved (so opening the dropdown after a select doesn't refetch).
  useEffect(() => {
    if (!entityKind) return;
    if (entry.resolvedEntityId) return;
    if (debounced.trim().length < 2) {
      patchSearch(field.code, { suggestions: [] });
      return;
    }
    const fn = getEntitySearchFn(entityKind);
    if (!fn) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fn(debounced)
      .then((suggestions: EntityResult[]) => {
        if (!cancelled) patchSearch(field.code, { suggestions });
      })
      .catch(() => {
        if (!cancelled) patchSearch(field.code, { suggestions: [] });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, entityKind, entry.resolvedEntityId]);

  // Close on outside click.
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const showDropdown = open && !entry.resolvedEntityId && entry.transientValue.length >= 2;
  const hasResults = entry.suggestions.length > 0;

  function handleSelect(result: EntityResult) {
    patchSearch(field.code, {
      resolvedEntityId: { id: result.id, label: result.label },
      transientValue: result.label,
      suggestions: [],
    });
    if (idTarget) {
      // Visible field carrying `ui.searchEntity`: write the picked id into the
      // paired hidden `*_id` field, and the readable name into this field's
      // own value so the submission body carries both.
      setFieldValue(idTarget, result.id);
      setFieldValue(field.code, result.label);
    }
    if (fillFields && result.raw && typeof result.raw === "object") {
      const raw = result.raw as Record<string, unknown>;
      for (const [localCode, sourceProp] of Object.entries(fillFields)) {
        const v = raw[sourceProp];
        if (v !== undefined) setFieldValue(localCode, v);
      }
    }
    setOpen(false);
  }

  function handleClear() {
    patchSearch(field.code, {
      resolvedEntityId: null,
      transientValue: "",
      suggestions: [],
    });
    if (idTarget) {
      setFieldValue(idTarget, null);
      setFieldValue(field.code, "");
    }
    if (fillFields) {
      for (const localCode of Object.keys(fillFields)) {
        setFieldValue(localCode, null);
      }
    }
    setOpen(true);
  }

  const inputValue = useMemo(
    () => entry.resolvedEntityId?.label ?? entry.transientValue,
    [entry.resolvedEntityId, entry.transientValue],
  );

  return (
    <FieldShell label={field.label} required={required} error={error}>
      <div ref={containerRef} className="relative">
        <input
          type="text"
          value={inputValue}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => {
            if (entry.resolvedEntityId) {
              patchSearch(field.code, {
                resolvedEntityId: null,
                transientValue: e.target.value,
              });
            } else {
              patchSearch(field.code, { transientValue: e.target.value });
            }
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // If user typed but never selected, clear transient on close (state-reset rule).
            if (!entry.resolvedEntityId && entry.transientValue.trim().length > 0) {
              // Small delay so click-to-select can fire first.
              setTimeout(() => {
                patchSearch(field.code, { transientValue: "" });
              }, 150);
            }
          }}
          className={cn(fieldClass, "pe-7")}
        />
        {entry.resolvedEntityId && !disabled ? (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear"
            className="absolute inset-e-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-black"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        ) : null}
        {loading ? (
          <Loader2
            className="absolute inset-e-5 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-gray-400"
            aria-hidden="true"
          />
        ) : null}

        {showDropdown ? (
          <div className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
            {hasResults ? (
              entry.suggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(s);
                  }}
                  className="flex w-full flex-col items-start gap-0.5 border-b border-gray-100 px-3 py-2 text-start text-xs last:border-b-0 hover:bg-gray-50"
                >
                  <span className="font-medium text-brand-black">{s.label}</span>
                  {s.subtitle ? (
                    <span className="text-[11px] text-gray-500">{s.subtitle}</span>
                  ) : null}
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-[11px] text-gray-400">
                {loading ? "Searching…" : "No results"}
              </p>
            )}
          </div>
        ) : null}
      </div>
    </FieldShell>
  );
}
