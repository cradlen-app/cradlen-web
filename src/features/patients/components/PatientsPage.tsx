"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { DataTablePagination } from "@/components/common/DataTablePagination";
import { useRouter } from "@/i18n/navigation";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { getActiveProfile } from "@/features/auth/lib/current-user";
import {
  canOpenPatientWorkspace,
  canRegisterPatient,
  canViewPatientAnalytics,
  isBranchManager,
  isClinical,
  isOwner,
} from "@/features/auth/lib/permissions";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import type { ApiJourneyStatus } from "@/features/visits/types/visits.api.types";
import type { PatientFilter } from "../types/patients.types";
import { usePatients } from "../hooks/usePatients";
import { usePatientsDirectory } from "../hooks/usePatientsDirectory";
import { PatientsHeader } from "./PatientsHeader";
import { RegisterPatientDrawer } from "./RegisterPatientDrawer";
import { PatientStatCards } from "./PatientStatCards";
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
  const router = useRouter();
  const branchId = useAuthContextStore((state) => state.branchId);
  const organizationId = useAuthContextStore((state) => state.organizationId);
  const { data: currentUser } = useCurrentUser();
  const activeProfile = getActiveProfile(currentUser);
  const canOpen = canOpenPatientWorkspace(activeProfile);
  const canViewAnalytics = canViewPatientAnalytics(activeProfile);
  const canRegister = canRegisterPatient(activeProfile);
  const [registering, setRegistering] = useState(false);
  const owner = isOwner(activeProfile);
  // A doctor (clinical, non-managerial) sees only their own patients; reception,
  // owners and branch managers keep the full branch directory.
  const personalScope =
    isClinical(activeProfile) &&
    !owner &&
    !isBranchManager(activeProfile);
  const [filter, setFilter] = useState<PatientFilter>("all");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  // OWNER may switch to an org-wide directory; everyone else is branch-scoped.
  const [scope, setScope] = useState<"branch" | "org">("branch");
  const orgWide = owner && scope === "org";

  const [page, setPage] = useState(1);

  // Reset to the first page whenever the result set's identity changes
  // (filter / search / scope). Adjusting state during render instead of in an
  // effect avoids the cascading re-render that setState-in-effect triggers.
  const resetKey = `${filter}|${deferredSearch}|${scope}`;
  const [lastResetKey, setLastResetKey] = useState(resetKey);
  if (resetKey !== lastResetKey) {
    setLastResetKey(resetKey);
    setPage(1);
  }

  // Paging is server-side: the request carries `page`, so `patients` is already
  // exactly the rows for the current page.
  const { data, isLoading, isError } = usePatients(branchId ?? undefined, {
    search: deferredSearch || undefined,
    journeyStatus: toJourneyStatusParam(filter),
    orgWide,
    mine: personalScope,
    page,
  });

  const patients = useMemo(() => data?.patients ?? [], [data?.patients]);
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, data?.totalPages ?? 1);

  const { selectedId, setSelectedId } = usePatientsDirectory(patients);

  const noBranch = !branchId && !orgWide;

  // Clamp during render so a shrinking dataset (e.g. the last row on the final
  // page is removed) never strands us past the last page, without an effect
  // that writes back into state.
  if (page > pageCount) {
    setPage(pageCount);
  }
  const currentPage = Math.min(page, pageCount);

  return (
    <div className="flex flex-col gap-4 p-4 lg:h-full lg:p-6">
      <PatientsHeader
        canRegister={canRegister}
        onRegister={() => setRegistering(true)}
      />

      {canViewAnalytics && !noBranch && (
        <PatientStatCards
          branchId={branchId ?? undefined}
          orgWide={orgWide}
          mine={personalScope}
        />
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white/50">
        <PatientsToolbar
          activeFilter={filter}
          search={search}
          onFilterChange={setFilter}
          onSearchChange={setSearch}
          scope={owner ? scope : undefined}
          onScopeChange={owner ? setScope : undefined}
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
              patients={patients}
              selectedId={selectedId}
              onSelect={(p) => setSelectedId(p.id)}
              onOpen={
                canOpen && organizationId && branchId
                  ? (p) =>
                      router.push(
                        `/${organizationId}/${branchId}/dashboard/patients/${p.id}`,
                      )
                  : undefined
              }
            />
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3">
          <p className="text-xs text-gray-400">
            {!isLoading && !noBranch &&
              t("showResults", { count: patients.length, total })}
          </p>
          {!isLoading && !noBranch && (
            <DataTablePagination
              page={currentPage}
              pageCount={pageCount}
              onPageChange={setPage}
              labels={{
                prev: t("pagination.prev"),
                next: t("pagination.next"),
                pageOf: t("pagination.pageOf", {
                  page: currentPage,
                  total: pageCount,
                }),
              }}
            />
          )}
        </div>
      </div>

      {canRegister && (
        <RegisterPatientDrawer
          open={registering}
          onOpenChange={setRegistering}
        />
      )}
    </div>
  );
}
