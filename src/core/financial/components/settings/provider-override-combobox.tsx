"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import { fetchServices } from "../../lib/services.api";

export const inputClass = cn(
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900",
  "placeholder:text-gray-400 outline-none transition-colors",
  "focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20",
);

type ServiceOption = { id: string; name: string; code: string };

/** Service typeahead for the provider price-override form (client-side filtered). */
export function ServiceComboboxField({
  orgId,
  displayValue,
  onChange,
  error,
}: {
  orgId: string;
  displayValue: string;
  onChange: (id: string, name: string) => void;
  error?: string;
}) {
  const t = useTranslations("financial.myPrices");
  const [search, setSearch] = useState(displayValue);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [options, setOptions] = useState<ServiceOption[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Debounce 300ms — matches InvoiceLineItemsEditor pattern
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const active = { cancelled: false };
    if (!debouncedSearch) {
      Promise.resolve().then(() => {
        if (!active.cancelled) setOptions([]);
      });
      return () => { active.cancelled = true; };
    }
    // Backend has no `search` query param — fetch active services and
    // filter client-side.
    const needle = debouncedSearch.toLowerCase();
    fetchServices(orgId, { active: true, limit: 100 })
      .then((res) => {
        if (!active.cancelled)
          setOptions(
            res.data
              .filter(
                (s) =>
                  s.name.toLowerCase().includes(needle) ||
                  s.code.toLowerCase().includes(needle),
              )
              .map((s) => ({ id: s.id, name: s.name, code: s.code })),
          );
      })
      .catch(() => { if (!active.cancelled) setOptions([]); });
    return () => { active.cancelled = true; };
  }, [debouncedSearch, orgId]);

  function handleSelect(svc: ServiceOption) {
    setSearch(svc.name);
    setShowDropdown(false);
    onChange(svc.id, svc.name);
  }

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-700">
        {t("fields.service")} <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          placeholder={t("fields.searchService")}
          className={cn(inputClass, error && "border-red-400")}
        />
        {showDropdown && options.length > 0 && (
          <ul className="absolute left-0 top-full z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
            {options.map((svc) => (
              <li key={svc.id}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-gray-50"
                  onMouseDown={() => handleSelect(svc)}
                >
                  <span>{svc.name}</span>
                  <span className="ml-2 font-mono text-xs text-gray-400">
                    {svc.code}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
