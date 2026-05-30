"use client";

import { useTranslations, useLocale } from "next-intl";
import { formatRepDate } from "../lib/medical-rep.utils";
import type { MedicalRep } from "../types/medical-rep.types";

interface Props {
  reps: MedicalRep[];
  isLoading: boolean;
  onRowClick: (rep: MedicalRep) => void;
}

const AVATAR_COLORS = [
  { bg: "bg-emerald-100", text: "text-emerald-700" },
  { bg: "bg-blue-100", text: "text-blue-700" },
  { bg: "bg-purple-100", text: "text-purple-700" },
  { bg: "bg-amber-100", text: "text-amber-700" },
  { bg: "bg-rose-100", text: "text-rose-700" },
];

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function getAvatarColor(name: string) {
  const code = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

export function MedicalRepTable({ reps, isLoading, onRowClick }: Props) {
  const t = useTranslations("medicalRep");
  const locale = useLocale();

  if (isLoading) return <TableSkeleton />;

  return (
    <table className="w-full border-collapse bg-white">
      <thead>
        <tr className="bg-gray-50">
          <th className="px-5 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-gray-500">
            {t("table.name")}
          </th>
          <th className="px-4 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-gray-500">
            {t("table.phone")}
          </th>
          <th className="px-4 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-gray-500">
            {t("table.products")}
          </th>
          <th className="px-4 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-gray-500">
            {t("table.lastVisit")}
          </th>
          <th className="px-4 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-gray-500">
            {t("table.visits")}
          </th>
          <th className="px-4 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-gray-500">
            {t("table.status")}
          </th>
          <th className="px-4 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-gray-500">
            {t("table.notes")}
          </th>
        </tr>
      </thead>
      <tbody>
        {reps.length === 0 ? (
          <tr>
            <td colSpan={7} className="py-16 text-center text-sm text-gray-400">
              {t("table.empty")}
            </td>
          </tr>
        ) : (
          reps.map((rep) => {
            const initials = getInitials(rep.full_name);
            const color = getAvatarColor(rep.full_name);
            const isActive = rep.status === "active";
            return (
              <tr
                key={rep.id}
                onClick={() => onRowClick(rep)}
                className="cursor-pointer border-t border-gray-100 hover:bg-gray-50"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${color.bg} ${color.text}`}
                    >
                      {initials}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-brand-black">{rep.full_name}</div>
                      {rep.company_name && (
                        <div className="text-xs text-gray-400">{rep.company_name}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{rep.phone ?? "—"}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {rep.products.length > 0 ? rep.products.join(" · ") : "—"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{formatRepDate(rep.last_visit_date, locale)}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{rep.visits_count}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-sm">
                    <span
                      className={`size-2 shrink-0 rounded-full ${isActive ? "bg-green-500" : "bg-red-500"}`}
                    />
                    <span className={isActive ? "text-green-600" : "text-red-600"}>
                      {isActive ? t("status.active") : t("status.blocked")}
                    </span>
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-400">{rep.notes ?? "—"}</td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}

function TableSkeleton() {
  return (
    <table className="w-full border-collapse">
      <tbody>
        {Array.from({ length: 10 }).map((_, i) => (
          <tr key={i} className="border-t border-gray-100">
            <td className="px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="size-8 animate-pulse rounded-full bg-gray-100" />
                <div>
                  <div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
                  <div className="mt-1 h-3 w-20 animate-pulse rounded bg-gray-100" />
                </div>
              </div>
            </td>
            <td className="px-4 py-3"><div className="h-4 w-24 animate-pulse rounded bg-gray-100" /></td>
            <td className="px-4 py-3"><div className="h-4 w-20 animate-pulse rounded bg-gray-100" /></td>
            <td className="px-4 py-3"><div className="h-4 w-20 animate-pulse rounded bg-gray-100" /></td>
            <td className="px-4 py-3"><div className="h-4 w-8 animate-pulse rounded bg-gray-100" /></td>
            <td className="px-4 py-3"><div className="h-5 w-14 animate-pulse rounded-full bg-gray-100" /></td>
            <td className="px-4 py-3"><div className="h-4 w-24 animate-pulse rounded bg-gray-100" /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
