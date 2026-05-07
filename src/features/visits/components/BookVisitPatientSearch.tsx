"use client";

import { useRef, useEffect } from "react";
import { Loader2, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Patient } from "../types/visits.types";

type Props = {
  searchInput: string;
  onSearchChange: (value: string) => void;
  searchResults: Patient[];
  isSearching: boolean;
  dropdownOpen: boolean;
  onDropdownOpenChange: (open: boolean) => void;
  selectedPatient: Patient | null;
  onSelectPatient: (patient: Patient) => void;
  onClearSearch: () => void;
};

export function BookVisitPatientSearch({
  searchInput,
  onSearchChange,
  searchResults,
  isSearching,
  dropdownOpen,
  onDropdownOpenChange,
  selectedPatient,
  onSelectPatient,
  onClearSearch,
}: Props) {
  const t = useTranslations("visits");
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        onDropdownOpenChange(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onDropdownOpenChange]);

  return (
    <div ref={searchRef} className="relative mt-4">
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
        {isSearching ? (
          <Loader2 className="size-4 shrink-0 animate-spin text-gray-400" aria-hidden="true" />
        ) : (
          <Search className="size-4 shrink-0 text-gray-400" aria-hidden="true" />
        )}
        <input
          value={searchInput}
          onChange={(e) => {
            const val = e.target.value;
            onSearchChange(val);
            if (selectedPatient && val !== selectedPatient.fullName) {
              onClearSearch();
              onSearchChange(val);
            }
            onDropdownOpenChange(true);
          }}
          onFocus={() => searchInput.length >= 2 && onDropdownOpenChange(true)}
          placeholder={t("create.searchPlaceholder")}
          className="flex-1 bg-transparent text-xs text-brand-black outline-none placeholder:text-gray-300"
        />
        {searchInput && (
          <button
            type="button"
            onClick={onClearSearch}
            className="shrink-0 text-gray-400 hover:text-brand-black"
            aria-label="Clear search"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      {dropdownOpen && searchInput.length >= 2 && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          {searchResults.length > 0 ? (
            <ul className="max-h-48 overflow-y-auto py-1">
              {searchResults.map((patient) => (
                <li key={patient.id}>
                  <button
                    type="button"
                    onClick={() => onSelectPatient(patient)}
                    className="w-full px-3 py-2 text-start hover:bg-gray-50"
                  >
                    <p className="text-xs font-medium text-brand-black">{patient.fullName}</p>
                    <p className="text-[11px] text-gray-400">
                      {patient.nationalId}
                      {patient.phoneNumber ? ` · ${patient.phoneNumber}` : ""}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          ) : !isSearching ? (
            <p className="px-3 py-3 text-xs text-gray-400">
              {t("create.patientNotFound")}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
