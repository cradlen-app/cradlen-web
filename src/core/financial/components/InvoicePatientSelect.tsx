"use client";

import { useState } from "react";
import { ChevronsUpDown, Loader2, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import { usePatientSearch } from "@/features/visits/hooks/usePatientSearch";

const inputClass = cn(
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900",
  "placeholder:text-gray-400 outline-none transition-colors",
  "focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20",
);

type Props = {
  /** Display name of the selected patient (for the closed trigger). */
  displayName?: string;
  onChange: (patientId: string, patientName: string) => void;
  error?: boolean;
};

/**
 * Searchable patient combobox for standalone invoice creation. Mirrors the
 * service combobox pattern in `InvoiceLineItemsEditor`. Backed by
 * `usePatientSearch`, which debounces and requires ≥2 characters.
 */
export function InvoicePatientSelect({ displayName, onChange, error }: Props) {
  const t = useTranslations("financial.invoice.fields");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const { data: patients = [], isFetching } = usePatientSearch(query);
  const tooShort = query.trim().length < 2;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          inputClass,
          "flex items-center justify-between gap-2 text-left",
          error && "border-red-400",
        )}
      >
        <span className={cn("truncate", !displayName && "text-gray-400")}>
          {displayName || t("selectPatient")}
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-gray-400" aria-hidden="true" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute start-0 top-full z-20 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
            <div className="relative border-b border-gray-100 p-2">
              <Search className="pointer-events-none absolute inset-s-4 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("patientSearchPlaceholder")}
                className={cn(inputClass, "h-8 py-1 ps-8")}
              />
            </div>
            <ul className="max-h-56 overflow-y-auto py-1">
              {tooShort ? (
                <li className="px-3 py-2 text-xs text-gray-400">
                  {t("searchHint")}
                </li>
              ) : isFetching ? (
                <li className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400">
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  {t("searching")}
                </li>
              ) : patients.length === 0 ? (
                <li className="px-3 py-2 text-xs text-gray-400">
                  {t("noPatients")}
                </li>
              ) : (
                patients.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onMouseDown={() => {
                        onChange(p.id, p.fullName);
                        setQuery("");
                        setOpen(false);
                      }}
                      className="flex w-full items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      <span className="truncate text-gray-900">{p.fullName}</span>
                      {p.phoneNumber && (
                        <span className="shrink-0 text-[11px] tabular-nums text-gray-400">
                          {p.phoneNumber}
                        </span>
                      )}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
