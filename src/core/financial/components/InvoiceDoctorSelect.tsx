"use client";

import { useMemo, useState } from "react";
import { ChevronsUpDown, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import { useStaff } from "@/core/staff/api";

const inputClass = cn(
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900",
  "placeholder:text-gray-400 outline-none transition-colors",
  "focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20",
);

type Props = {
  organizationId?: string;
  branchId?: string;
  /** Display name of the selected doctor (for the closed trigger). */
  displayName?: string;
  onChange: (doctorId: string, doctorName: string) => void;
  error?: boolean;
};

/**
 * Searchable doctor combobox for standalone invoice creation. Lists clinical
 * staff (`isClinical`) at the active org/branch from `useStaff`, filtered
 * client-side by name.
 */
export function InvoiceDoctorSelect({
  organizationId,
  branchId,
  displayName,
  onChange,
  error,
}: Props) {
  const t = useTranslations("financial.invoice.fields");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const { data: staff = [] } = useStaff(organizationId, branchId);

  const doctors = useMemo(
    () =>
      staff
        .filter((m) => m.isClinical)
        .map((m) => ({ id: m.id, name: `${m.firstName} ${m.lastName}`.trim() })),
    [staff],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return doctors;
    return doctors.filter((d) => d.name.toLowerCase().includes(q));
  }, [query, doctors]);

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
          {displayName || t("selectDoctor")}
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
                placeholder={t("doctorSearchPlaceholder")}
                className={cn(inputClass, "h-8 py-1 ps-8")}
              />
            </div>
            <ul className="max-h-56 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-xs text-gray-400">
                  {t("noDoctors")}
                </li>
              ) : (
                filtered.map((d) => (
                  <li key={d.id}>
                    <button
                      type="button"
                      onMouseDown={() => {
                        onChange(d.id, d.name);
                        setQuery("");
                        setOpen(false);
                      }}
                      className="flex w-full items-center px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      <span className="truncate text-gray-900">{d.name}</span>
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
