import { Check, ChevronDown, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { DropdownMenu } from "radix-ui";
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
    <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      {/* Mobile: dropdown */}
      <div className="w-full sm:hidden">
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
                onValueChange={(value) => onFilterChange(value as StaffFilter)}
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
        className="-mx-1 hidden max-w-full items-center overflow-x-auto rounded-full bg-gray-50 p-1 sm:flex"
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
              "shrink-0 whitespace-nowrap rounded-full px-4 py-1 text-sm transition-colors",
              activeFilter === filter.value
                ? "bg-brand-primary text-white shadow-sm"
                : "text-gray-500 hover:bg-white hover:text-brand-black",
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
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
