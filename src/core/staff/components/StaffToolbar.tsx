import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { STAFF_API_ROLE } from "@/features/auth/lib/auth.constants";
import { cn } from "@/common/utils/utils";
import type { StaffFilter } from "../types/staff.types";

const STAFF_FILTERS = [
  "all",
  STAFF_API_ROLE.OWNER,
  STAFF_API_ROLE.BRANCH_MANAGER,
  STAFF_API_ROLE.STAFF,
  STAFF_API_ROLE.EXTERNAL,
] as const satisfies readonly StaffFilter[];

type StaffToolbarProps = {
  activeFilter: StaffFilter;
  search: string;
  onFilterChange: (filter: StaffFilter) => void;
  onSearchChange: (search: string) => void;
  /** OWNER-only scope toggle. Hidden when undefined. */
  scope?: "org" | "mine";
  onScopeChange?: (scope: "org" | "mine") => void;
};

export function StaffToolbar({
  activeFilter,
  search,
  onFilterChange,
  onSearchChange,
  scope,
  onScopeChange,
}: StaffToolbarProps) {
  const t = useTranslations("staff");
  const filters = STAFF_FILTERS.map((value) => ({
    value,
    label: value === "all" ? t("allStaff") : t(`apiRoles.${value}`),
  }));

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div
        className="flex flex-wrap rounded-full bg-gray-50 p-1"
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

      <div className="flex flex-wrap items-center gap-2">
        {scope && onScopeChange && (
          <div className="flex rounded-full bg-gray-50 p-1" role="tablist">
            {(["org", "mine"] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={scope === value}
                onClick={() => onScopeChange(value)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs transition-colors",
                  scope === value
                    ? "bg-brand-primary text-white shadow-sm"
                    : "text-gray-500 hover:bg-white hover:text-brand-black",
                )}
              >
                {t(`scope.${value}`)}
              </button>
            ))}
          </div>
        )}

        <label className="relative block w-full sm:w-64">
          <span className="sr-only">{t("searchPlaceholder")}</span>
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-9 w-full rounded-full border border-gray-200 bg-white ps-3 pe-9 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
          />
          <Search
            className="pointer-events-none absolute inset-e-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
        </label>
      </div>
    </div>
  );
}
