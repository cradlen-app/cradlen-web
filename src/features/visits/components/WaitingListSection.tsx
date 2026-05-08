"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useWaitingList } from "../hooks/useWaitingList";
import { BookVisitDrawer } from "./BookVisitDrawer";
import { WaitingListTable } from "./WaitingListTable";

type Props = {
  branchId: string | null | undefined;
  organizationId: string | null | undefined;
  branchName?: string;
  canCreateVisit: boolean;
  canManageStatus: boolean;
  assignedToMe?: boolean;
  isDoctor?: boolean;
};

export function WaitingListSection({
  branchId,
  organizationId,
  branchName,
  canCreateVisit,
  canManageStatus,
  assignedToMe,
  isDoctor,
}: Props) {
  const t = useTranslations("visits.waitingList");
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerKey, setDrawerKey] = useState(0);

  const query = useWaitingList({
    branchId,
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

        {canCreateVisit && (
          <button
            type="button"
            onClick={() => {
              setDrawerOpen(true);
              setDrawerKey((k) => k + 1);
            }}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-brand-primary px-3 text-xs font-semibold text-white transition-colors hover:bg-brand-primary/90"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            {t("newVisit")}
          </button>
        )}
      </header>

      <WaitingListTable
        rows={rows}
        isLoading={query.isLoading}
        isError={query.isError}
        canManageStatus={canManageStatus}
        isDoctor={isDoctor}
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
        <BookVisitDrawer
          key={drawerKey}
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
