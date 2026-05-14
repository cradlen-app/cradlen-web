"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form";
import { Loader2, Search, X } from "lucide-react";
import { cn } from "@/common/utils/utils";
import { usePatientSearch } from "@/features/visits/hooks/usePatientSearch";
import { useProcedures } from "../hooks/useProcedures";
import type { NewEventFormValues } from "../lib/calendar.schemas";

const labelClass = "block text-xs font-medium text-gray-600 mb-1";
const errorClass = "mt-1 text-xs text-red-500";

type BaseProps = {
  register: UseFormRegister<NewEventFormValues>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  errors: FieldErrors<NewEventFormValues>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: UseFormSetValue<any>;
};

// ── Procedure picker ──────────────────────────────────────────────────────

function ProcedurePickerField({
  setValue,
  error,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: UseFormSetValue<any>;
  error?: string;
}) {
  const t = useTranslations("calendar");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const { data: results = [], isFetching } = useProcedures(query);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function handleSelect(p: { id: string; name: string; code: string }) {
    setValue("procedure_id", p.id, { shouldValidate: true });
    setSelectedName(p.name);
    setQuery(p.name);
    setOpen(false);
  }

  function handleClear() {
    setValue("procedure_id", "", { shouldValidate: false });
    setSelectedName("");
    setQuery("");
  }

  return (
    <div ref={ref} className="relative">
      <label className={labelClass}>{t("form.procedure")} *</label>
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm transition-colors",
          "focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/10",
        )}
      >
        {isFetching ? (
          <Loader2 className="size-4 shrink-0 animate-spin text-gray-400" aria-hidden />
        ) : (
          <Search className="size-4 shrink-0 text-gray-400" aria-hidden />
        )}
        <input
          value={query}
          onChange={(e) => {
            const v = e.target.value;
            setQuery(v);
            if (selectedName && v !== selectedName) handleClear();
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={t("form.procedurePlaceholder")}
          className="flex-1 bg-transparent text-sm text-brand-black outline-none placeholder:text-gray-400"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 text-gray-400 hover:text-brand-black"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          {results.length > 0 ? (
            <ul className="max-h-48 overflow-y-auto py-1">
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(p)}
                    className="w-full px-3 py-2 text-start hover:bg-gray-50"
                  >
                    <p className="text-xs font-medium text-brand-black">{p.name}</p>
                    <p className="text-[11px] text-gray-400">
                      {p.code}
                      {p.specialty ? ` · ${p.specialty.name}` : ""}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          ) : !isFetching ? (
            <p className="px-3 py-3 text-xs text-gray-400">
              {t("form.procedureNotFound")}
            </p>
          ) : null}
        </div>
      )}

      {error && <p className={errorClass}>{error}</p>}
    </div>
  );
}

// ── Patient picker (optional, for procedures only) ─────────────────────────

function PatientSearchField({
  setValue,
  error,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: UseFormSetValue<any>;
  error?: string;
}) {
  const t = useTranslations("calendar");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const { data: results = [], isFetching } = usePatientSearch(query);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function handleSelect(p: {
    id: string;
    fullName: string;
    nationalId?: string;
    phoneNumber?: string;
  }) {
    setValue("patient_id", p.id, { shouldValidate: true });
    setSelectedName(p.fullName);
    setQuery(p.fullName);
    setOpen(false);
  }

  function handleClear() {
    setValue("patient_id", "", { shouldValidate: false });
    setSelectedName("");
    setQuery("");
  }

  return (
    <div ref={ref} className="relative">
      <label className={labelClass}>{t("form.patient")}</label>
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm transition-colors",
          "focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/10",
        )}
      >
        {isFetching ? (
          <Loader2 className="size-4 shrink-0 animate-spin text-gray-400" aria-hidden />
        ) : (
          <Search className="size-4 shrink-0 text-gray-400" aria-hidden />
        )}
        <input
          value={query}
          onChange={(e) => {
            const v = e.target.value;
            setQuery(v);
            if (selectedName && v !== selectedName) handleClear();
            setOpen(true);
          }}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder={t("form.patientPlaceholder")}
          className="flex-1 bg-transparent text-sm text-brand-black outline-none placeholder:text-gray-400"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 text-gray-400 hover:text-brand-black"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        )}
      </div>

      {open && query.length >= 2 && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          {results.length > 0 ? (
            <ul className="max-h-48 overflow-y-auto py-1">
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(p)}
                    className="w-full px-3 py-2 text-start hover:bg-gray-50"
                  >
                    <p className="text-xs font-medium text-brand-black">{p.fullName}</p>
                    <p className="text-[11px] text-gray-400">
                      {p.nationalId}
                      {p.phoneNumber ? ` · ${p.phoneNumber}` : ""}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          ) : !isFetching ? (
            <p className="px-3 py-3 text-xs text-gray-400">
              {t("form.patientNotFound")}
            </p>
          ) : null}
        </div>
      )}

      {error && <p className={errorClass}>{error}</p>}
    </div>
  );
}

// ── Procedure-event fields ─────────────────────────────────────────────────

export function ProcedureFields({ errors, setValue }: BaseProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const errs = errors as any;
  return (
    <div className="space-y-4">
      <ProcedurePickerField
        setValue={setValue}
        error={errs?.procedure_id?.message}
      />
      <PatientSearchField setValue={setValue} error={errs?.patient_id?.message} />
    </div>
  );
}

// DAY_OFF / MEETING / GENERIC require no extra fields beyond the base form.
