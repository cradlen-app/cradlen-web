"use client";

import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useWaitingList } from "../hooks/useWaitingList";
import type { WaitingListFilter } from "../types/visits.types";
import { NewVisitDrawer } from "./NewVisitDrawer";
import { WaitingListFilters } from "./WaitingListFilters";
import { WaitingListTable } from "./WaitingListTable";

type Props = {
  branchId: string | null | undefined;
  organizationId: string | null | undefined;
  branchName?: string;
  canCreateVisit: boolean;
  canManageStatus: boolean;
  assignedToMe?: boolean;
};

export function WaitingListSection({
  branchId,
  organizationId,
  branchName,
  canCreateVisit,
  canManageStatus,
  assignedToMe,
}: Props) {
  const t = useTranslations("visits.waitingList");
  const [filter, setFilter] = useState<WaitingListFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQ(searchInput.trim()), 250);
    return () => clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [filter, debouncedQ]);

  const query = useWaitingList({
    branchId,
    filter,
    q: debouncedQ,
    assignedToMe,
    page,
    limit: 10,
  });

  const rows = query.data?.rows ?? [];
  const totalPages = query.data?.totalPages ?? 1;

  return (
    <section
      aria-label={t("title")}
      className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
    >
      <header className="mb-3 flex flex-wrap items-center gap-3">
        <h2 className="text-sm font-semibold text-brand-black me-auto">
          {t("title")}
        </h2>

        <div className="relative">
          <Search
            className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className={cn(
              "h-8 w-56 rounded-full border border-gray-200 bg-white ps-7 pe-3 text-xs text-brand-black outline-none placeholder:text-gray-300",
              "focus:border-brand-primary/40 focus:ring-2 focus:ring-brand-primary/20",
            )}
          />
        </div>

        {canCreateVisit && (
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-brand-primary px-3 text-xs font-semibold text-white transition-colors hover:bg-brand-primary/90"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            {t("newVisit")}
          </button>
        )}
      </header>

      <div className="mb-3">
        <WaitingListFilters value={filter} onChange={setFilter} />
      </div>

      <WaitingListTable
        rows={rows}
        branchId={branchId ?? ""}
        isLoading={query.isLoading}
        isError={query.isError}
        canManageStatus={canManageStatus}
        onRetry={() => query.refetch()}
      />

      {totalPages > 1 && (
        <nav
          aria-label="Waiting list pagination"
          className="mt-3 flex items-center justify-end gap-2"
        >
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="inline-flex h-7 items-center rounded-full border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 disabled:opacity-50 hover:bg-gray-50"
          >
            ‹
          </button>
          <span className="text-[11px] text-gray-500 tabular-nums">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="inline-flex h-7 items-center rounded-full border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 disabled:opacity-50 hover:bg-gray-50"
          >
            ›
          </button>
        </nav>
      )}

      {canCreateVisit && (
        <NewVisitDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          branchId={branchId}
          organizationId={organizationId}
          branchName={branchName}
        />
      )}
    </section>
  );
}
