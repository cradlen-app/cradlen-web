"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  getEntitySearchFn,
  type EntityResult,
} from "@/builder/fields/entity.registry";
import { MedicationDrawer } from "@/features/medications/components/MedicationDrawer";
import { useCreateMedication } from "@/features/medications/hooks/useManageMedications";
import type { MedicationFormValues } from "@/features/medications/lib/medications.schemas";
import type {
  CreateMedicationRequest,
  Medication,
} from "@/features/medications/types/medications.types";

export interface SelectedMedication {
  /** Catalog id when picked from search; absent when typed as a new drug. */
  id?: string;
  name: string;
  generic_name?: string;
  form?: string;
  strength?: string;
  company?: string;
  default_dose_amount?: number;
  default_dose_unit?: string;
  default_dose_frequency?: string;
  default_dose_route?: string;
}

interface Props {
  value: SelectedMedication[];
  onChange: (next: SelectedMedication[]) => void;
  disabled?: boolean;
}

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10";

function emptyToUndefined(v: string | undefined): string | undefined {
  return v === undefined ? undefined : v.trim() || undefined;
}

/**
 * "Products discussed" picker: chips of selected medicines + a catalog search
 * box. Picking a result adds it by id; typing a name with no match opens the
 * shared Medicines drawer to create the full medicine, which is then added as a
 * chip (and promoted to the rep on save).
 */
export function ProductsDiscussed({ value, onChange, disabled }: Props) {
  const t = useTranslations("medicalRep.visit.products");
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [results, setResults] = useState<EntityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchFn = useMemo(() => getEntitySearchFn("medication"), []);
  const createMed = useCreateMedication();

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
    resetSearch();
  }

  function resetSearch() {
    setQuery("");
    setDebounced("");
    setResults([]);
    setOpen(false);
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  async function handleCreateMedicine(values: MedicationFormValues) {
    const req: CreateMedicationRequest = {
      code: values.code,
      name: values.name,
      generic_name: emptyToUndefined(values.genericName),
      form: emptyToUndefined(values.form),
      strength: emptyToUndefined(values.strength),
      category: emptyToUndefined(values.category),
      company: emptyToUndefined(values.company),
      notes: emptyToUndefined(values.notes),
      default_dose_amount: values.defaultDoseAmount?.trim()
        ? parseFloat(values.defaultDoseAmount)
        : undefined,
      default_dose_unit: emptyToUndefined(values.defaultDoseUnit),
      default_dose_frequency: emptyToUndefined(values.defaultDoseFrequency),
      default_dose_route: emptyToUndefined(values.defaultDoseRoute),
      medical_rep_id: values.medicalRepId || undefined,
    };
    // Throws on failure (the hook toasts) — the drawer stays open for a retry.
    const res = await createMed.mutateAsync(req);
    const med =
      res && typeof res === "object" && "data" in res
        ? (res as { data: Medication }).data
        : (res as unknown as Medication);
    if (med?.id) {
      add({ id: med.id, name: med.name, strength: med.strength ?? undefined });
    }
    setNewName(null);
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
              {m.strength ? `${m.name} (${m.strength})` : m.name}
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
            className={`${inputClass} pe-7`}
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
                    setNewName(trimmed);
                    setOpen(false);
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

      {newName !== null ? (
        <MedicationDrawer
          open
          medication={null}
          createDefaults={{ name: newName }}
          isPending={createMed.isPending}
          onOpenChange={(o) => {
            if (!o) setNewName(null);
          }}
          onSubmit={handleCreateMedicine}
        />
      ) : null}
    </div>
  );
}
