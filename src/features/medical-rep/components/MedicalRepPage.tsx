"use client";

import { useState, useDeferredValue } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { getActiveProfile } from "@/features/auth/lib/current-user";
import { canOpenMedicalRepOverview } from "@/features/auth/lib/permissions";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { MedicalRepTable } from "./MedicalRepTable";
import { useMedicalReps } from "../hooks/useMedicalReps";

const PAGE_LIMIT = 10;

export function MedicalRepPage() {
  const t = useTranslations("medicalRep");

  const router = useRouter();
  const organizationId = useAuthContextStore((s) => s.organizationId);
  const branchId = useAuthContextStore((s) => s.branchId);
  const { data: currentUser } = useCurrentUser();
  const canOpen = canOpenMedicalRepOverview(getActiveProfile(currentUser));

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const deferredSearch = useDeferredValue(search);

  const { data, isLoading } = useMedicalReps({
    page,
    limit: PAGE_LIMIT,
    search: deferredSearch,
  });

  const total = data?.meta.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_LIMIT);
  const from = total === 0 ? 0 : (page - 1) * PAGE_LIMIT + 1;
  const to = Math.min(page * PAGE_LIMIT, total);

  return (
    <div className="flex min-h-full flex-col">
      {/* Page header */}
      <div className="px-6 py-5">
        <h1 className="text-2xl font-bold text-brand-black">{t("title")}</h1>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-end gap-4 border-b border-gray-100 px-6 pb-3">
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
            placeholder={t("search")}
            className="w-64 rounded-lg border border-gray-200 py-2 pe-4 ps-9 text-sm outline-none transition-colors focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-x-auto">
        <MedicalRepTable
          reps={data?.data ?? []}
          isLoading={isLoading}
          onOpen={
            canOpen && organizationId && branchId
              ? (rep) =>
                  router.push(
                    `/${organizationId}/${branchId}/dashboard/medical-rep/rep/${rep.id}`,
                  )
              : undefined
          }
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
    </div>
  );
}
