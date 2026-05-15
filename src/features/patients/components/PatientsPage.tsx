"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import type { ApiJourneyStatus } from "@/features/visits/types/visits.api.types";
import type { PatientFilter } from "../types/patients.types";
import { usePatients } from "../hooks/usePatients";
import { usePatientsDirectory } from "../hooks/usePatientsDirectory";
import { PatientsHeader } from "./PatientsHeader";
import { PatientsTable } from "./PatientsTable";
import { PatientsToolbar } from "./PatientsToolbar";

const PAGE_SIZE = 11;

function PatientsTableSkeleton() {
  return (
    <div className="overflow-x-auto bg-white px-4">
      <div className="h-10 border-b border-gray-100" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 border-b border-gray-50 py-3 last:border-0"
        >
          <div className="size-8 shrink-0 animate-pulse rounded-full bg-gray-100" />
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="h-3 w-36 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-32 animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-28 animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-16 animate-pulse rounded-full bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

function toJourneyStatusParam(filter: PatientFilter): ApiJourneyStatus | undefined {
  return filter === "all" ? undefined : filter;
}

export function PatientsPage() {
  const t = useTranslations("patients");
  const branchId = useAuthContextStore((state) => state.branchId);
  const [filter, setFilter] = useState<PatientFilter>("all");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const { data, isLoading, isError } = usePatients(branchId ?? undefined, {
    search: deferredSearch || undefined,
    journeyStatus: toJourneyStatusParam(filter),
  });

  const patients = data?.patients ?? [];
  const total = data?.total ?? 0;

  const { selectedId, setSelectedId } = usePatientsDirectory(patients);

  const noBranch = !branchId;

  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(patients.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [filter, deferredSearch]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const pagedPatients = useMemo(
    () => patients.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [patients, page],
  );

  return (
    <div className="flex h-full flex-col gap-4 p-4 lg:p-6">
      <PatientsHeader />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white/50">
        <PatientsToolbar
          activeFilter={filter}
          search={search}
          onFilterChange={setFilter}
          onSearchChange={setSearch}
        />

        <div className="min-h-0 flex-1 overflow-auto">
          {isLoading ? (
            <PatientsTableSkeleton />
          ) : noBranch ? (
            <div className="flex min-h-60 items-center justify-center text-sm text-gray-400">
              {t("noBranch")}
            </div>
          ) : isError ? (
            <div className="flex min-h-60 items-center justify-center text-sm text-red-400">
              {t("loadError")}
            </div>
          ) : (
            <PatientsTable
              patients={pagedPatients}
              selectedId={selectedId}
              onSelect={(p) => setSelectedId(p.id)}
            />
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3">
          <p className="text-xs text-gray-400">
            {!isLoading && !noBranch &&
              t("showResults", { count: pagedPatients.length, total })}
          </p>
          {!isLoading && !noBranch && pageCount > 1 && (
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
                {t("pagination.pageOf", { page, total: pageCount })}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={page >= pageCount}
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
