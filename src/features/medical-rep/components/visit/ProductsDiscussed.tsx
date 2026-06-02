"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog } from "radix-ui";
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

/**
 * "Products discussed" picker: chips of selected medicines + a catalog search
 * box. Picking a result adds it by id; typing a name with no match opens a
 * dialog to enter the full new-medicine details — the server resolves/creates
 * it in the catalog and promotes it to the rep on save.
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
        <NewMedicationDialog
          initialName={newName}
          onCancel={() => setNewName(null)}
          onAdd={(med) => {
            add(med);
            setNewName(null);
          }}
        />
      ) : null}
    </div>
  );
}

function NewMedicationDialog({
  initialName,
  onAdd,
  onCancel,
}: {
  initialName: string;
  onAdd: (med: SelectedMedication) => void;
  onCancel: () => void;
}) {
  const t = useTranslations("medicalRep.visit.products.newDialog");
  const [form, setForm] = useState({
    name: initialName,
    generic_name: "",
    strength: "",
    form: "",
    company: "",
    default_dose_route: "",
    default_dose_amount: "",
    default_dose_unit: "",
    default_dose_frequency: "",
  });

  function field(key: keyof typeof form) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value })),
    };
  }

  function submit() {
    const name = form.name.trim();
    if (!name) return;
    const amount = form.default_dose_amount.trim();
    onAdd({
      name,
      generic_name: form.generic_name.trim() || undefined,
      strength: form.strength.trim() || undefined,
      form: form.form.trim() || undefined,
      company: form.company.trim() || undefined,
      default_dose_route: form.default_dose_route.trim() || undefined,
      default_dose_amount: amount ? Number(amount) : undefined,
      default_dose_unit: form.default_dose_unit.trim() || undefined,
      default_dose_frequency: form.default_dose_frequency.trim() || undefined,
    });
  }

  return (
    <Dialog.Root open onOpenChange={(o) => (o ? null : onCancel())}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/25" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[41] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-2xl outline-none">
          <Dialog.Title className="text-base font-semibold text-brand-black">
            {t("title")}
          </Dialog.Title>
          <Dialog.Description className="sr-only">
            {t("title")}
          </Dialog.Description>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Labeled label={t("name")} className="col-span-2">
              <input className={inputClass} {...field("name")} />
            </Labeled>
            <Labeled label={t("genericName")}>
              <input className={inputClass} {...field("generic_name")} />
            </Labeled>
            <Labeled label={t("strength")}>
              <input
                className={inputClass}
                placeholder="500mg"
                {...field("strength")}
              />
            </Labeled>
            <Labeled label={t("form")}>
              <input
                className={inputClass}
                placeholder="Tablet"
                {...field("form")}
              />
            </Labeled>
            <Labeled label={t("company")}>
              <input className={inputClass} {...field("company")} />
            </Labeled>
            <Labeled label={t("doseAmount")}>
              <input
                type="number"
                min={0}
                className={inputClass}
                {...field("default_dose_amount")}
              />
            </Labeled>
            <Labeled label={t("doseUnit")}>
              <input
                className={inputClass}
                placeholder="mg"
                {...field("default_dose_unit")}
              />
            </Labeled>
            <Labeled label={t("doseFrequency")}>
              <input
                className={inputClass}
                placeholder="BID"
                {...field("default_dose_frequency")}
              />
            </Labeled>
            <Labeled label={t("route")}>
              <input
                className={inputClass}
                placeholder="Oral"
                {...field("default_dose_route")}
              />
            </Labeled>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                {t("cancel")}
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={submit}
              disabled={!form.name.trim()}
              className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-primary/90 disabled:opacity-40"
            >
              {t("add")}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Labeled({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1 ${className ?? ""}`}>
      <span className="text-xs font-medium text-gray-500">{label}</span>
      {children}
    </label>
  );
}
