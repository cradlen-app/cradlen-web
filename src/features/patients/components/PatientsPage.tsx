"use client";

import { useDeferredValue, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import type { ApiJourneyStatus } from "@/features/visits/types/visits.api.types";
import type { PatientFilter } from "../types/patients.types";
import { usePatients } from "../hooks/usePatients";
import { usePatientsDirectory } from "../hooks/usePatientsDirectory";
import { PatientsHeader } from "./PatientsHeader";
import { PatientsTable } from "./PatientsTable";
import { PatientsToolbar } from "./PatientsToolbar";

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

        <div className="min-h-0 flex-1 overflow-y-auto">
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
              patients={patients}
              selectedId={selectedId}
              onSelect={(p) => setSelectedId(p.id)}
            />
          )}
        </div>

        <div className="border-t border-gray-100 px-4 py-3">
          <p className="text-xs text-gray-400">
            {!isLoading && !noBranch &&
              t("showResults", { count: patients.length, total })}
          </p>
        </div>
      </div>
    </div>
  );
}
