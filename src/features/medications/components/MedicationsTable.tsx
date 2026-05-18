"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Medication } from "../types/medications.types";

interface Props {
  medications: Medication[];
  isLoading: boolean;
  onEdit: (medication: Medication) => void;
  onDelete: (medication: Medication) => void;
}

export function MedicationsTable({ medications, isLoading, onEdit, onDelete }: Props) {
  const t = useTranslations("medications");

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-gray-50">
          <th className="px-5 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-gray-500">
            {t("table.columns.name")}
          </th>
          <th className="px-4 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-gray-500">
            {t("table.columns.form")}
          </th>
          <th className="px-4 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-gray-500">
            {t("table.columns.strength")}
          </th>
          <th className="px-4 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-gray-500">
            {t("table.columns.category")}
          </th>
          <th className="hidden px-4 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-gray-500 lg:table-cell">
            {t("table.columns.defaultDose")}
          </th>
          <th className="px-4 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-gray-500">
            {t("table.columns.usage")}
          </th>
          <th className="hidden px-4 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-gray-500 xl:table-cell">
            {t("table.columns.notes")}
          </th>
          <th className="w-20 px-4 py-2.5" />
        </tr>
      </thead>
      <tbody>
        {medications.length === 0 ? (
          <tr>
            <td colSpan={8} className="py-16 text-center text-sm text-gray-400">
              {t("table.empty")}
            </td>
          </tr>
        ) : (
          medications.map((med) => (
            <tr key={med.id} className="group border-t border-gray-100 hover:bg-gray-50">
              <td className="px-5 py-3">
                <div className="text-sm font-semibold text-brand-black">{med.name}</div>
                {med.generic_name && (
                  <div className="text-xs text-gray-400">{med.generic_name}</div>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">{med.form ?? "—"}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{med.strength ?? "—"}</td>
              <td className="px-4 py-3 text-sm text-gray-400">—</td>
              <td className="hidden px-4 py-3 text-sm text-gray-400 lg:table-cell">—</td>
              <td className="px-4 py-3 text-sm text-gray-600">{med.total_prescriptions}</td>
              <td className="hidden px-4 py-3 text-sm text-gray-400 xl:table-cell">—</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => onEdit(med)}
                    className="inline-flex size-7 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-400 transition-colors hover:border-brand-primary/30 hover:text-brand-primary"
                    aria-label={t("actions.edit")}
                  >
                    <Pencil className="size-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(med)}
                    className="inline-flex size-7 items-center justify-center rounded-md border border-red-100 bg-white text-gray-400 transition-colors hover:border-red-300 hover:text-red-500"
                    aria-label={t("actions.delete")}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

function TableSkeleton() {
  return (
    <table className="w-full border-collapse">
      <tbody>
        {Array.from({ length: 8 }).map((_, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <tr key={i} className="border-t border-gray-100">
            <td className="px-5 py-3">
              <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
              <div className="mt-1 h-3 w-24 animate-pulse rounded bg-gray-100" />
            </td>
            <td className="px-4 py-3">
              <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
            </td>
            <td className="px-4 py-3">
              <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
            </td>
            <td className="px-4 py-3">
              <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
            </td>
            <td className="hidden px-4 py-3 lg:table-cell">
              <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
            </td>
            <td className="px-4 py-3">
              <div className="h-4 w-8 animate-pulse rounded bg-gray-100" />
            </td>
            <td className="hidden px-4 py-3 xl:table-cell">
              <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
            </td>
            <td className="px-4 py-3">
              <div className="h-7 w-16 animate-pulse rounded bg-gray-100" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
