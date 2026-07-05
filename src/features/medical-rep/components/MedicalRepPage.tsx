"use client";

import { useState, useDeferredValue } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { cn } from "@/common/utils/utils";
import { useRouter } from "@/i18n/navigation";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { getActiveProfile } from "@/features/auth/lib/current-user";
import { canOpenMedicalRepWorkspace } from "@/features/auth/lib/permissions";
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
  const canOpen = canOpenMedicalRepWorkspace(getActiveProfile(currentUser));

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
    <div className="flex h-full flex-col gap-4 p-4 pb-24 lg:p-6 lg:pb-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-medium text-brand-black">{t("title")}</h1>
      </div>

      {/* Card: toolbar + table + pagination */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white/50">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-end gap-2 px-4 py-3">
          <label className="relative block min-w-0 flex-1 sm:w-64 sm:flex-none">
            <span className="sr-only">{t("search")}</span>
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={t("search")}
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
    </div>
  );
}
