"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import { usePatientSearch } from "@/features/visits/hooks/usePatientSearch";

type Props = {
  value: string;
  onChange: (value: string) => void;
  /** A row was picked from the cross-org search. */
  onSelect: (patientId: string) => void;
  /** The picked patient was cleared — fall back to creating a new one. */
  onClear: () => void;
  linked: boolean;
  inputClass: string;
  id?: string;
};

/**
 * Name field that doubles as a cross-org patient search — the same
 * lookup-or-create affordance the booking template gets from
 * `searchEntity`/`allowCreate`, which this drawer cannot reuse because
 * `EntitySearchInput` is coupled to `TemplateExecutionContext`.
 *
 * It matters here more than anywhere: `Patient` is a global master index with a
 * unique national id, so typing demographics for someone already registered at
 * *any* clinic ends in a 409. Surfacing matches while the user types turns that
 * dead end into a link.
 *
 * Selection only reports the id upward; the parent owns fetching the full
 * identity, because it is the parent that must prefill and lock the sibling
 * fields.
 */
export function PatientSearchField({
  value,
  onChange,
  onSelect,
  onClear,
  linked,
  inputClass,
  id,
}: Props) {
  const t = useTranslations("patients.register");
  const [focused, setFocused] = useState(false);

  // Never search once a patient is linked — the field then shows their resolved
  // name and re-querying it would just offer to re-pick the same person.
  const { data: matches = [], isFetching } = usePatientSearch(
    linked ? "" : value,
  );
  const showResults = focused && !linked && value.trim().length >= 2;

  if (linked) {
    return (
      <div
        className={cn(inputClass, "flex items-center justify-between gap-2")}
        data-testid="linked-patient"
      >
        <span className="truncate">{value}</span>
        <button
          type="button"
          onClick={onClear}
          aria-label={t("clearLinkedPatient")}
          className="shrink-0 rounded p-0.5 text-gray-400 transition-colors hover:text-gray-700"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        // Delayed so a click on a result lands before the list unmounts.
        onBlur={() => setTimeout(() => setFocused(false), 120)}
        placeholder={t("searchPlaceholder")}
        autoComplete="off"
        role="combobox"
        aria-expanded={showResults}
        aria-controls="patient-search-results"
        className={inputClass}
      />

      {showResults && (
        <ul
          id="patient-search-results"
          role="listbox"
          className="absolute start-0 top-full z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {isFetching ? (
            <li className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400">
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              {t("searching")}
            </li>
          ) : matches.length === 0 ? (
            <li className="px-3 py-2 text-xs text-gray-400">
              {t("noMatchesCreateNew")}
            </li>
          ) : (
            matches.map((p) => (
              <li key={p.id} role="option" aria-selected={false}>
                <button
                  type="button"
                  // mousedown, not click: blur would close the list first.
                  onMouseDown={() => onSelect(p.id)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <span className="truncate text-gray-900">{p.fullName}</span>
                  {p.phoneLast3 && (
                    <span className="shrink-0 text-[11px] tabular-nums text-gray-400">
                      ••• {p.phoneLast3}
                    </span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
