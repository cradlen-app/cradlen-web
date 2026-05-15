import { Check, ChevronDown, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { DropdownMenu } from "radix-ui";
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
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3 sm:gap-3">
      {/* Mobile: dropdown */}
      <div className="w-36 shrink-0 sm:hidden">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              aria-label={t("filtersLabel")}
              className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-full border border-gray-200 bg-white ps-4 pe-3 text-sm text-brand-black outline-none transition-colors hover:border-brand-primary/40 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 data-[state=open]:border-brand-primary/40"
            >
              <span className="truncate">
                {filters.find((f) => f.value === activeFilter)?.label}
              </span>
              <ChevronDown
                className="size-4 shrink-0 text-gray-400 transition-transform data-[state=open]:rotate-180"
                aria-hidden="true"
              />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="start"
              sideOffset={6}
              className="z-50 min-w-[var(--radix-dropdown-menu-trigger-width)] overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg shadow-black/5"
            >
              <DropdownMenu.RadioGroup
                value={activeFilter}
                onValueChange={(value) => onFilterChange(value as PatientFilter)}
              >
                {filters.map((filter) => (
                  <DropdownMenu.RadioItem
                    key={filter.value}
                    value={filter.value}
                    className={cn(
                      "flex cursor-pointer items-center justify-between gap-2.5 px-3.5 py-2 text-sm outline-none transition-colors",
                      "data-[highlighted]:bg-gray-50",
                      activeFilter === filter.value
                        ? "text-brand-primary"
                        : "text-brand-black",
                    )}
                  >
                    <span className="truncate font-medium">{filter.label}</span>
                    {activeFilter === filter.value && (
                      <Check
                        className="size-4 shrink-0 text-brand-primary"
                        aria-hidden="true"
                      />
                    )}
                  </DropdownMenu.RadioItem>
                ))}
              </DropdownMenu.RadioGroup>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      {/* Desktop: pill group */}
      <div
        className="hidden flex-wrap gap-1 rounded-full bg-gray-50 p-1 sm:flex"
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

      <label className="relative block min-w-0 flex-1 sm:w-64 sm:flex-none">
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
