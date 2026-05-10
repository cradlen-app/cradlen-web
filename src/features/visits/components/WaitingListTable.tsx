"use client";

import { useState } from "react";
import { ChevronDown, Loader2, Pencil, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { Dialog } from "radix-ui";
import { useRouter } from "@/i18n/navigation";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUpdateVisitStatus } from "../hooks/useUpdateVisitStatus";
import type { Visit, VisitStatus } from "../types/visits.types";
import { EditVisitDrawer } from "./EditVisitDrawer";
import {
  VisitPriorityBadge,
  VisitStatusBadge,
  VisitTypeBadge,
} from "./VisitBadges";

type Props = {
  rows: Visit[];
  isLoading: boolean;
  isError: boolean;
  canManageStatus: boolean;
  isDoctor?: boolean;
  onRetry: () => void;
};

const TERMINAL_STATUSES: VisitStatus[] = ["COMPLETED", "CANCELLED", "NO_SHOW"];

const NEXT_STATUSES: Partial<Record<VisitStatus, VisitStatus[]>> = {
  SCHEDULED: ["CHECKED_IN", "CANCELLED"],
  CHECKED_IN: ["IN_PROGRESS", "CANCELLED", "NO_SHOW"],
  IN_PROGRESS: ["COMPLETED"],
};

function StatusSelect({ visit }: { visit: Visit }) {
  const t = useTranslations("visits");
  const updateStatus = useUpdateVisitStatus();
  const [pendingCancel, setPendingCancel] = useState(false);

  const isTerminal = TERMINAL_STATUSES.includes(visit.status);
  const nextOptions = NEXT_STATUSES[visit.status] ?? [];

  async function commit(status: VisitStatus) {
    await updateStatus.mutateAsync({
      visitId: visit.id,
      status,
      branchId: visit.branchId,
    });
  }

  function handleChange(next: VisitStatus) {
    if (next === "CANCELLED") {
      setPendingCancel(true);
      return;
    }
    void commit(next);
  }

  if (isTerminal) {
    return <VisitStatusBadge status={visit.status} />;
  }

  return (
    <>
      <div className="relative inline-flex items-center">
        <select
          value={visit.status}
          onChange={(e) => handleChange(e.target.value as VisitStatus)}
          disabled={updateStatus.isPending}
          className={cn(
            "appearance-none rounded-full border border-gray-200 bg-white py-1 ps-2.5 pe-7 text-[11px] font-medium text-gray-700 outline-none",
            "focus:border-brand-primary/40 focus:ring-2 focus:ring-brand-primary/20",
            "disabled:opacity-60",
          )}
          aria-label="Change status"
        >
          <option value={visit.status}>{t(`status.${visit.status}`)}</option>
          {nextOptions
            .filter((s) => s !== visit.status)
            .map((status) => (
              <option key={status} value={status}>
                {t(`status.${status}`)}
              </option>
            ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute inset-e-1.5 size-3.5 text-gray-400"
          aria-hidden="true"
        />
      </div>

      <Dialog.Root
        open={pendingCancel}
        onOpenChange={(open) => !open && setPendingCancel(false)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl outline-none">
            <Dialog.Title className="text-base font-semibold text-brand-black">
              {t("actions.cancelVisitTitle")}
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-xs text-gray-500">
              {visit.patient.fullName} will be marked as cancelled. This cannot
              be undone.
            </Dialog.Description>
            <div className="mt-5 flex items-center justify-end gap-2">
              <Dialog.Close className="inline-flex h-8 items-center rounded-full border border-gray-200 px-3 text-xs font-medium text-gray-600 hover:bg-gray-50">
                {t("actions.close")}
              </Dialog.Close>
              <button
                type="button"
                onClick={async () => {
                  setPendingCancel(false);
                  await commit("CANCELLED");
                }}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-red-500 px-3 text-xs font-semibold text-white hover:bg-red-500/90"
              >
                {updateStatus.isPending && (
                  <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                )}
                {t("actions.confirmCancel")}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

const GRID =
  "grid-cols-[40px_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.5fr)_88px_84px_124px_32px]";

export function WaitingListTable({
  rows,
  isLoading,
  isError,
  canManageStatus,
  isDoctor,
  onRetry,
}: Props) {
  const t = useTranslations("visits.waitingList");
  const tVisits = useTranslations("visits");
  const router = useRouter();
  const branchId = useAuthContextStore((s) => s.branchId);
  const organizationId = useAuthContextStore((s) => s.organizationId);
  const [editVisit, setEditVisit] = useState<Visit | null>(null);

  if (isError) {
    return (
      <div className="flex flex-col items-start gap-2 rounded-xl border border-red-100 bg-red-50/50 px-4 py-3 text-xs text-red-600">
        <p>{t("loadError")}</p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full border border-red-200 bg-white px-3 py-1 font-medium text-red-600 hover:bg-red-50"
        >
          {tVisits("actions.retry")}
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="overflow-hidden rounded-xl border border-gray-100 min-w-155">
        <div
          className={cn(
            "grid gap-3 border-b border-gray-100 bg-gray-50/60 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400",
            GRID,
          )}
        >
          <span>{t("columns.queue")}</span>
          <span>{t("columns.patient")}</span>
          <span>{t("columns.doctor")}</span>
          <span>{t("columns.chiefComplaint")}</span>
          <span>{t("columns.type")}</span>
          <span>{t("columns.priority")}</span>
          <span className="text-end">{t("columns.status")}</span>
          <span />
        </div>

        {isLoading ? (
          <div className="space-y-1 p-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-10 animate-pulse rounded-lg bg-gray-50"
              />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-xs text-gray-400">
            {t("empty")}
          </p>
        ) : (
          <ul>
            {rows.map((visit) => (
              <li
                key={visit.id}
                className={cn(
                  "grid items-center gap-3 border-b border-gray-50 px-3 py-2.5 last:border-0 hover:bg-gray-50/40",
                  GRID,
                )}
              >
                <span className="text-xs font-medium text-gray-500 tabular-nums">
                  {visit.queueNumber ?? "—"}
                </span>
                <p className="truncate text-xs font-medium text-brand-black">
                  {visit.patient.fullName}
                </p>
                <span className="truncate text-xs text-gray-500">
                  {visit.assignedDoctorName ?? "—"}
                </span>
                <span className="truncate text-xs text-gray-400 italic">
                  {visit.chiefComplaint?.trim() || visit.notes?.trim() || "—"}
                </span>
                <VisitTypeBadge type={visit.type} />
                <VisitPriorityBadge priority={visit.priority} />
                <div className="flex items-center justify-end">
                  {isDoctor && visit.status === "IN_PROGRESS" ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() =>
                        router.push(
                          `/${organizationId}/${branchId}/dashboard/visits/${visit.id}`,
                        )
                      }
                      className="rounded-full bg-brand-primary text-white hover:bg-brand-primary/90"
                    >
                      <Play className="size-3.5" aria-hidden="true" />
                      <span>{tVisits("currentVisit.startVisit")}</span>
                    </Button>
                  ) : canManageStatus ? (
                    <StatusSelect visit={visit} />
                  ) : (
                    <VisitStatusBadge status={visit.status} />
                  )}
                </div>
                {canManageStatus &&
                !TERMINAL_STATUSES.includes(visit.status) ? (
                  <button
                    type="button"
                    onClick={() => setEditVisit(visit)}
                    aria-label={tVisits("editVisit.title")}
                    className="inline-flex size-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-brand-black"
                  >
                    <Pencil className="size-3.5" aria-hidden="true" />
                  </button>
                ) : (
                  <span />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <EditVisitDrawer
        open={!!editVisit}
        onOpenChange={(open) => !open && setEditVisit(null)}
        visit={editVisit}
        organizationId={organizationId}
        branchId={branchId}
      />
    </div>
  );
}
