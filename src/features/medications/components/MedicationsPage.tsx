"use client";

import { useState, useDeferredValue } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { cn } from "@/common/utils/utils";
import { MedicationsTable } from "./MedicationsTable";
import { MedicationDrawer } from "./MedicationDrawer";
import { DeleteMedicationDialog } from "./DeleteMedicationDialog";
import { useMedications } from "../hooks/useMedications";
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
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [deletingMedication, setDeletingMedication] = useState<Medication | null>(null);

  const deferredSearch = useDeferredValue(search);

  const { data, isLoading } = useMedications({
    page,
    limit: PAGE_LIMIT,
    search: deferredSearch,
  });

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
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled
              title={t("filters.comingSoon")}
              className="inline-flex h-9 cursor-not-allowed items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-400 opacity-60"
            >
              {t("filters.category")} ↓
            </button>
            <button
              type="button"
              disabled
              title={t("filters.comingSoon")}
              className="inline-flex h-9 cursor-not-allowed items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-400 opacity-60"
            >
              {t("filters.form")} ↓
            </button>
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
