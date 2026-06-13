"use client";

import { useState, useDeferredValue } from "react";
import { useTranslations } from "next-intl";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
} from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { cn } from "@/common/utils/utils";
import { MedicationsTable } from "./MedicationsTable";
import { MedicationDrawer } from "./MedicationDrawer";
import { DeleteMedicationDialog } from "./DeleteMedicationDialog";
import { useMedications } from "../hooks/useMedications";
import { useMedicationFacets } from "../hooks/useMedicationFacets";
import type { MedicationSort } from "../lib/medications.queryKeys";
import {
  useCreateMedication,
  useUpdateMedication,
  useDeleteMedication,
} from "../hooks/useManageMedications";
import type { Medication } from "../types/medications.types";
import type { MedicationFormValues } from "../lib/medications.schemas";

const PAGE_LIMIT = 10;

export function MedicationsPage() {
  const t = useTranslations("medications");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [form, setForm] = useState<string | undefined>(undefined);
  const [sort, setSort] = useState<MedicationSort>("name");
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [deletingMedication, setDeletingMedication] = useState<Medication | null>(null);

  const deferredSearch = useDeferredValue(search);

  // Any filter/sort change invalidates the current page index — reset inline
  // (matching the search handler) rather than in an effect.
  function changeCategory(value: string | undefined) {
    setCategory(value);
    setPage(1);
  }
  function changeForm(value: string | undefined) {
    setForm(value);
    setPage(1);
  }
  function changeSort(value: string | undefined) {
    setSort((value as MedicationSort) ?? "name");
    setPage(1);
  }

  const { data, isLoading } = useMedications({
    page,
    limit: PAGE_LIMIT,
    search: deferredSearch,
    category,
    form,
    sort,
  });

  const { data: facets } = useMedicationFacets();

  const createMutation = useCreateMedication();
  const updateMutation = useUpdateMedication();
  const deleteMutation = useDeleteMedication();

  function openAddDrawer() {
    setEditingMedication(null);
    setDrawerOpen(true);
  }

  function openEditDrawer(medication: Medication) {
    setEditingMedication(medication);
    setDrawerOpen(true);
  }

  async function handleDrawerSubmit(values: MedicationFormValues) {
    const emptyToUndefined = (v: string | undefined) =>
      v === undefined ? undefined : v.trim() || undefined;
    const numericDoseAmount =
      values.defaultDoseAmount?.trim() ? parseFloat(values.defaultDoseAmount) : undefined;
    try {
      if (editingMedication) {
        await updateMutation.mutateAsync({
          id: editingMedication.id,
          data: {
            name: values.name,
            generic_name: emptyToUndefined(values.genericName),
            form: emptyToUndefined(values.form),
            strength: emptyToUndefined(values.strength),
            category: emptyToUndefined(values.category),
            company: emptyToUndefined(values.company),
            notes: emptyToUndefined(values.notes),
            default_dose_amount: numericDoseAmount,
            default_dose_unit: emptyToUndefined(values.defaultDoseUnit),
            default_dose_frequency: emptyToUndefined(values.defaultDoseFrequency),
            default_dose_route: emptyToUndefined(values.defaultDoseRoute),
            medical_rep_id: values.medicalRepId ? values.medicalRepId : null,
          },
        });
      } else {
        await createMutation.mutateAsync({
          code: values.code,
          name: values.name,
          generic_name: emptyToUndefined(values.genericName),
          form: emptyToUndefined(values.form),
          strength: emptyToUndefined(values.strength),
          category: emptyToUndefined(values.category),
          company: emptyToUndefined(values.company),
          notes: emptyToUndefined(values.notes),
          default_dose_amount: numericDoseAmount,
          default_dose_unit: emptyToUndefined(values.defaultDoseUnit),
          default_dose_frequency: emptyToUndefined(values.defaultDoseFrequency),
          default_dose_route: emptyToUndefined(values.defaultDoseRoute),
          medical_rep_id: values.medicalRepId || undefined,
        });
      }
      setDrawerOpen(false);
    } catch {
      // onError in the mutation hook shows the toast with the backend message
    }
  }

  async function handleDeleteConfirm() {
    if (!deletingMedication) return;
    await deleteMutation.mutateAsync(deletingMedication.id);
    setDeletingMedication(null);
  }

  const total = data?.meta.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_LIMIT);
  const from = total === 0 ? 0 : (page - 1) * PAGE_LIMIT + 1;
  const to = Math.min(page * PAGE_LIMIT, total);

  return (
    <div className="flex h-full flex-col gap-4 p-4 pb-24 lg:p-6 lg:pb-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium text-brand-black">{t("title")}</h1>
          <p className="mt-1 text-sm text-gray-400">{t("subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={openAddDrawer}
          className="inline-flex h-9 items-center gap-2 rounded-full bg-brand-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90"
        >
          <Plus className="size-4" aria-hidden="true" />
          {t("addButton")}
        </button>
      </div>

      {/* Card: toolbar + table + pagination */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white/50">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <FilterMenu
              label={t("filters.category")}
              allLabel={t("filters.all")}
              value={category}
              options={facets?.categories ?? []}
              onChange={changeCategory}
            />
            <FilterMenu
              label={t("filters.form")}
              allLabel={t("filters.all")}
              value={form}
              options={facets?.forms ?? []}
              onChange={changeForm}
            />
            <FilterMenu
              label={t("sort.label")}
              value={sort}
              options={[
                { value: "name", label: t("sort.default") },
                { value: "usage", label: t("sort.usage") },
              ]}
              onChange={changeSort}
              isActive={sort !== "name"}
            />
          </div>
          <label className="relative block min-w-0 flex-1 sm:w-64 sm:flex-none">
            <span className="sr-only">{t("searchPlaceholder")}</span>
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={t("searchPlaceholder")}
              className="h-9 w-full rounded-full border border-gray-200 bg-white pe-4 ps-9 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
            />
            <Search
              className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
          </label>
        </div>

        {/* Table */}
        <div className="min-h-0 flex-1 overflow-auto pb-20 lg:pb-0">
          <MedicationsTable
            medications={data?.data ?? []}
            isLoading={isLoading}
            onEdit={openEditDrawer}
            onDelete={setDeletingMedication}
          />
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3">
          <p className="text-xs text-gray-400">
            {!isLoading &&
              total > 0 &&
              t("showResults", { count: to - from + 1, total })}
          </p>
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label={t("pagination.prev")}
                className={cn(
                  "inline-flex size-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors",
                  "hover:border-brand-primary/40 hover:text-brand-primary",
                  "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-500",
                )}
              >
                <ChevronLeft className="size-3.5 rtl:rotate-180" aria-hidden="true" />
              </button>
              <span className="px-1.5 text-xs tabular-nums text-gray-500">
                {t("pagination.pageOf", { page, total: totalPages })}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                aria-label={t("pagination.next")}
                className={cn(
                  "inline-flex size-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors",
                  "hover:border-brand-primary/40 hover:text-brand-primary",
                  "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-500",
                )}
              >
                <ChevronRight className="size-3.5 rtl:rotate-180" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Drawer */}
      <MedicationDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        medication={editingMedication}
        onSubmit={handleDrawerSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete dialog */}
      <DeleteMedicationDialog
        medication={deletingMedication}
        onOpenChange={(open) => {
          if (!open) setDeletingMedication(null);
        }}
        onConfirm={() => void handleDeleteConfirm()}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}

type FilterOption = { value: string; label: string };

/**
 * Pill dropdown for a single filter/sort axis. Pass `allLabel` for an "All"
 * reset entry (category/form, value `undefined`); omit it for a fixed-choice
 * axis (sort). String options are treated as `{ value, label }` pairs.
 */
function FilterMenu({
  label,
  allLabel,
  value,
  options,
  onChange,
  isActive,
}: {
  label: string;
  allLabel?: string;
  value: string | undefined;
  options: (string | FilterOption)[];
  onChange: (value: string | undefined) => void;
  isActive?: boolean;
}) {
  const ALL = "__all__";
  const normalized: FilterOption[] = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o,
  );
  const selected = normalized.find((o) => o.value === value);
  const active = isActive ?? value !== undefined;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-full border px-4 text-sm outline-none transition-colors data-[state=open]:border-brand-primary/40",
            active
              ? "border-brand-primary/40 bg-brand-primary/5 text-brand-primary"
              : "border-gray-200 bg-white text-gray-600 hover:border-brand-primary/40 hover:text-brand-black",
          )}
        >
          <span className="truncate">
            {selected ? `${label}: ${selected.label}` : label}
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
          className="z-50 max-h-72 min-w-44 overflow-auto rounded-xl border border-gray-100 bg-white py-1 shadow-lg shadow-black/5"
        >
          <DropdownMenu.RadioGroup
            value={value ?? ALL}
            onValueChange={(v) => onChange(v === ALL ? undefined : v)}
          >
            {allLabel !== undefined && (
              <FilterMenuItem
                value={ALL}
                label={allLabel}
                selected={value === undefined}
              />
            )}
            {normalized.map((option) => (
              <FilterMenuItem
                key={option.value}
                value={option.value}
                label={option.label}
                selected={value === option.value}
              />
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function FilterMenuItem({
  value,
  label,
  selected,
}: {
  value: string;
  label: string;
  selected: boolean;
}) {
  return (
    <DropdownMenu.RadioItem
      value={value}
      className={cn(
        "flex cursor-pointer items-center justify-between gap-2.5 px-3.5 py-2 text-sm outline-none transition-colors data-[highlighted]:bg-gray-50",
        selected ? "text-brand-primary" : "text-brand-black",
      )}
    >
      <span className="truncate font-medium">{label}</span>
      {selected && (
        <Check className="size-4 shrink-0 text-brand-primary" aria-hidden="true" />
      )}
    </DropdownMenu.RadioItem>
  );
}
