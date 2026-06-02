"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  getEntitySearchFn,
  type EntityResult,
} from "@/builder/fields/entity.registry";

export interface SelectedMedication {
  /** Catalog id when picked from search; absent when typed as a new drug. */
  id?: string;
  name: string;
}

interface Props {
  value: SelectedMedication[];
  onChange: (next: SelectedMedication[]) => void;
  disabled?: boolean;
}

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 pe-7 text-sm outline-none transition-colors focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10";

/**
 * "Products discussed" picker: chips of selected medicines + a catalog search
 * box. Picking a result adds it by id; typing a brand-new name offers an
 * "Add" action (no id) — the server resolves/creates it on save and promotes it
 * to the rep's medicines.
 */
export function ProductsDiscussed({ value, onChange, disabled }: Props) {
  const t = useTranslations("medicalRep.visit.products");
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [results, setResults] = useState<EntityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchFn = useMemo(() => getEntitySearchFn("medication"), []);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    if (!searchFn) return;
    if (debounced.trim().length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    searchFn(debounced)
      .then((r) => {
        if (!cancelled) setResults(r);
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, searchFn]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedIds = new Set(
    value.map((v) => v.id).filter((id): id is string => !!id),
  );
  const selectedNames = new Set(value.map((v) => v.name.trim().toLowerCase()));

  function add(med: SelectedMedication) {
    if (med.id && selectedIds.has(med.id)) return;
    if (!med.id && selectedNames.has(med.name.trim().toLowerCase())) return;
    onChange([...value, med]);
    setQuery("");
    setDebounced("");
    setResults([]);
    setOpen(false);
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  const trimmed = query.trim();
  const hasExact =
    selectedNames.has(trimmed.toLowerCase()) ||
    results.some((r) => r.label.trim().toLowerCase() === trimmed.toLowerCase());
  const showCreate = trimmed.length >= 2 && !hasExact;
  const visibleResults = results.filter((r) => !selectedIds.has(r.id));

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-gray-700">{t("label")}</p>

      <div className="flex flex-wrap items-center gap-1.5">
        {value.length > 0 ? (
          value.map((m, i) => (
            <span
              key={m.id ?? `new-${i}`}
              className="inline-flex items-center gap-1 rounded-full border border-brand-primary/30 bg-brand-primary/5 px-2.5 py-1 text-xs text-brand-black"
            >
              {m.name}
              {!disabled ? (
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label={t("remove")}
                  className="text-gray-400 hover:text-brand-black"
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              ) : null}
            </span>
          ))
        ) : (
          <span className="text-sm text-gray-400">{t("empty")}</span>
        )}
      </div>

      {!disabled ? (
        <div ref={containerRef} className="relative mt-2 max-w-md">
          <input
            type="text"
            value={query}
            placeholder={t("searchPlaceholder")}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            className={inputClass}
          />
          {loading ? (
            <Loader2
              className="absolute inset-e-2 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-gray-400"
              aria-hidden="true"
            />
          ) : null}

          {open && (visibleResults.length > 0 || showCreate) ? (
            <div className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
              {visibleResults.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    add({ id: r.id, name: r.label });
                  }}
                  className="flex w-full flex-col items-start gap-0.5 border-b border-gray-100 px-3 py-2 text-start text-xs last:border-b-0 hover:bg-gray-50"
                >
                  <span className="font-medium text-brand-black">{r.label}</span>
                  {r.subtitle ? (
                    <span className="text-[11px] text-gray-500">
                      {r.subtitle}
                    </span>
                  ) : null}
                </button>
              ))}
              {showCreate ? (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    add({ name: trimmed });
                  }}
                  className="flex w-full items-center gap-1.5 px-3 py-2 text-start text-xs text-brand-primary hover:bg-gray-50"
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  {t("addNew", { name: trimmed })}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
