"use client";

import { useState, useDeferredValue } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
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
    <div className="flex min-h-full flex-col">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-5">
        <div>
          <h1 className="text-2xl font-bold text-brand-black">{t("title")}</h1>
          <p className="mt-1 text-sm text-gray-400">{t("subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={openAddDrawer}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90"
        >
          + {t("addButton")}
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-6 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled
            title={t("filters.comingSoon")}
            className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-400 opacity-60"
          >
            {t("filters.category")} ↓
          </button>
          <button
            type="button"
            disabled
            title={t("filters.comingSoon")}
            className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-400 opacity-60"
          >
            {t("filters.form")} ↓
          </button>
        </div>
        <div className="relative">
          <Search
            className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t("searchPlaceholder")}
            className="w-64 rounded-lg border border-gray-200 py-2 pe-4 ps-9 text-sm outline-none transition-colors focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-x-auto pb-20 lg:pb-0">
        <MedicationsTable
          medications={data?.data ?? []}
          isLoading={isLoading}
          onEdit={openEditDrawer}
          onDelete={setDeletingMedication}
        />
      </div>

      {/* Pagination */}
      {!isLoading && total > 0 && (
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
          <span className="text-sm text-gray-400">
            {t("table.showing", { from, to, total })}
          </span>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 10) }).map((_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`inline-flex size-8 items-center justify-center rounded-lg text-sm transition-colors ${
                    page === p
                      ? "bg-brand-primary text-white"
                      : "border border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {p}
                </button>
              );
            })}
            {totalPages > 10 && (
              <span className="px-1 text-sm text-gray-400">…</span>
            )}
          </div>
        </div>
      )}

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
