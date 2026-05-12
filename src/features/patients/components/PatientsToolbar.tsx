import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import type { PatientFilter } from "../types/patients.types";

const PATIENT_FILTERS: PatientFilter[] = ["all", "ACTIVE", "COMPLETED", "CANCELLED"];

type PatientsToolbarProps = {
  activeFilter: PatientFilter;
  search: string;
  onFilterChange: (filter: PatientFilter) => void;
  onSearchChange: (search: string) => void;
};

export function PatientsToolbar({
  activeFilter,
  search,
  onFilterChange,
  onSearchChange,
}: PatientsToolbarProps) {
  const t = useTranslations("patients");

  const filters = PATIENT_FILTERS.map((value) => ({
    value,
    label: value === "all" ? t("allPatients") : t(`journeyStatus.${value}`),
  }));

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
      <div
        className="flex flex-wrap gap-1 rounded-full bg-gray-50 p-1"
        role="tablist"
        aria-label={t("filtersLabel")}
      >
        {filters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            role="tab"
            aria-selected={activeFilter === filter.value}
            onClick={() => onFilterChange(filter.value)}
            className={cn(
              "rounded-full px-4 py-1 text-sm transition-colors",
              activeFilter === filter.value
                ? "bg-brand-primary text-white shadow-sm"
                : "text-gray-500 hover:bg-white hover:text-brand-black",
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <label className="relative block w-full sm:w-64">
        <span className="sr-only">{t("search")}</span>
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t("search")}
          className="h-9 w-full rounded-full border border-gray-200 bg-white ps-3 pe-9 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
        />
        <Search
          className="pointer-events-none absolute inset-e-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
          aria-hidden="true"
        />
      </label>
    </div>
  );
}
