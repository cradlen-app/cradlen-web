"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
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
  flagged,
}: FieldInputProps) {
  const searchEntity = field.config?.ui?.searchEntity;
  const entityKind =
    searchEntity?.kind ?? (field.config?.logic?.entity as string | undefined);
  const idTarget = searchEntity?.idTarget;
  const fillFields = searchEntity?.fillFields;
  const fillEntitySearches = searchEntity?.fillEntitySearches;
  const allowCreate = searchEntity?.allowCreate === true;
  const placeholder = (field.config?.ui?.placeholder as string | undefined) ?? "Search…";
  const setFieldValue = useSetFieldValue();

  const entry = useSearchEntry(field.code);
  const patchSearch = usePatchSearch();
  const [open, setOpen] = useState(false);
  const [debounced, setDebounced] = useState(entry.transientValue);
  const [loading, setLoading] = useState(false);
  // Highlighted suggestion for keyboard navigation (-1 = none).
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const baseId = useId();
  const listboxId = `${baseId}-listbox`;
  const optionId = (i: number) => `${baseId}-opt-${i}`;

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
  // Clamp during render so a shrunk suggestion set never points the highlight at
  // a missing row (no setState-in-effect needed).
  const activeOption =
    activeIndex >= 0 && activeIndex < entry.suggestions.length ? activeIndex : -1;

  // Keep the highlighted option scrolled into view as the user arrows through.
  useEffect(() => {
    if (!showDropdown || activeOption < 0 || !listRef.current) return;
    listRef.current
      .querySelector<HTMLElement>(`[data-idx="${activeOption}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [showDropdown, activeOption]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (disabled) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!showDropdown) {
        setOpen(true);
        return;
      }
      if (hasResults) {
        setActiveIndex((i) => Math.min(entry.suggestions.length - 1, i + 1));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (showDropdown && hasResults) setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      if (showDropdown && activeOption >= 0) {
        e.preventDefault();
        handleSelect(entry.suggestions[activeOption]);
      }
    } else if (e.key === "Escape") {
      if (showDropdown) {
        e.preventDefault();
        setOpen(false);
      }
    }
  }

  function handleSelect(result: EntityResult) {
    setActiveIndex(-1);
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
    } else {
      // No hidden id sibling — the field carries its own value binding (e.g. the
      // diagnosis `description`). Mirror the picked label into form values so the
      // submission serializes the selected catalog text, not the free-typed
      // search query left behind by the allowCreate `onChange` path.
      setFieldValue(field.code, result.label);
    }
    setOpen(false);
    // Fill sibling fields from the picked row. When the entity exposes a lazy
    // `resolve` (e.g. the global patient lookup defers full identity to an
    // on-select, throttled+audited fetch), pull the full payload first.
    if (fillFields || fillEntitySearches) void applyFill(result);
  }

  async function applyFill(result: EntityResult) {
    let source: Record<string, unknown> | null =
      result.raw && typeof result.raw === "object"
        ? (result.raw as Record<string, unknown>)
        : null;
    if (result.resolve) {
      try {
        const resolved = await result.resolve();
        if (resolved) source = resolved;
      } catch {
        // Identity reveal failed (throttled/offline): fall back to the minimal
        // search row so selection still works, just without the deferred fields.
      }
    }
    if (!source) return;
    const raw = source;
    if (fillFields) {
      for (const [localCode, sourceProp] of Object.entries(fillFields)) {
        const v = raw[sourceProp];
        if (v !== undefined) setFieldValue(localCode, v);
      }
    }
    if (fillEntitySearches) {
      for (const [targetCode, spec] of Object.entries(fillEntitySearches)) {
        const nestedId = raw[spec.idSource];
        const nestedLabel = raw[spec.labelSource];
        if (typeof nestedId === "string" && nestedId.length > 0) {
          const label = typeof nestedLabel === "string" ? nestedLabel : "";
          patchSearch(targetCode, {
            resolvedEntityId: { id: nestedId, label },
            transientValue: label,
            suggestions: [],
          });
          setFieldValue(targetCode, label);
          if (spec.fillFields) {
            for (const [localCode, sourceProp] of Object.entries(spec.fillFields)) {
              const v = raw[sourceProp];
              if (v !== undefined) setFieldValue(localCode, v);
            }
          }
        }
      }
    }
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
    if (fillEntitySearches) {
      for (const [targetCode, spec] of Object.entries(fillEntitySearches)) {
        patchSearch(targetCode, {
          resolvedEntityId: null,
          transientValue: "",
          suggestions: [],
        });
        setFieldValue(targetCode, "");
        if (spec.fillFields) {
          for (const localCode of Object.keys(spec.fillFields)) {
            setFieldValue(localCode, null);
          }
        }
      }
    }
    setActiveIndex(-1);
    setOpen(true);
  }

  const inputValue = useMemo(
    () => entry.resolvedEntityId?.label ?? entry.transientValue,
    [entry.resolvedEntityId, entry.transientValue],
  );

  return (
    <FieldShell label={field.label} required={required} error={error} flagged={flagged}>
      <div ref={containerRef} className="relative">
        <input
          type="text"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeOption >= 0 ? optionId(activeOption) : undefined
          }
          value={inputValue}
          placeholder={placeholder}
          disabled={disabled}
          onKeyDown={handleKeyDown}
          onChange={(e) => {
            const next = e.target.value;
            // New query — drop the highlight so it never points at a stale row.
            setActiveIndex(-1);
            if (entry.resolvedEntityId) {
              patchSearch(field.code, {
                resolvedEntityId: null,
                transientValue: next,
              });
              // The user is editing over a previously-picked entity — drop the
              // resolved id so the LOOKUP slot doesn't carry a stale value.
              if (idTarget) setFieldValue(idTarget, null);
            } else {
              patchSearch(field.code, { transientValue: next });
            }
            // Lookup-or-create: mirror the typed value into formValues so the
            // submission builder serializes it at the host field's binding.path.
            if (allowCreate) setFieldValue(field.code, next);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // Lookup-or-create fields keep the typed value as the create payload.
            if (allowCreate) return;
            // Pure-lookup: if user typed but never selected, clear transient on
            // close (state-reset rule).
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
          <div
            ref={listRef}
            id={listboxId}
            role="listbox"
            className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
          >
            {hasResults ? (
              entry.suggestions.map((s, idx) => (
                <button
                  key={s.id}
                  id={optionId(idx)}
                  type="button"
                  role="option"
                  aria-selected={idx === activeOption}
                  data-idx={idx}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(s);
                  }}
                  className={cn(
                    "flex w-full flex-col items-start gap-0.5 border-b border-gray-100 px-3 py-2 text-start text-xs last:border-b-0 hover:bg-gray-50",
                    idx === activeOption && "bg-gray-50",
                  )}
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
