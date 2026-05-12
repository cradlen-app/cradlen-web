"use client";

import { Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/common/utils/utils";
import {
  useBranchInProgress,
  type DoctorGroup,
} from "../hooks/useBranchInProgress";
import type { Visit } from "../types/visits.types";
import {
  VisitPriorityBadge,
  VisitStatusBadge,
  VisitTypeBadge,
} from "./VisitBadges";

type Props = {
  branchId: string | null | undefined;
  organizationId: string | null | undefined;
  filterDoctorId?: string;
};

const GRID =
  "grid-cols-[36px_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto]";

const GRID_ACTIONS =
  "grid-cols-[36px_minmax(0,1.5fr)_minmax(0,1fr)_88px_84px_auto_auto]";

function DoctorTable({
  group,
  showHeader,
  showStartButton,
  branchId,
  organizationId,
}: {
  group: DoctorGroup;
  showHeader: boolean;
  showStartButton?: boolean;
  branchId: string;
  organizationId: string;
}) {
  const t = useTranslations("visits.inProgress");
  const tCols = useTranslations("visits.waitingList.columns");
  const tWaiting = useTranslations("visits.waitingList");

  return (
    <div className="space-y-2">
      {showHeader && (
        <header className="flex items-baseline gap-2 px-1">
          <h3 className="text-xs font-semibold text-brand-black">
            {group.doctorName}
          </h3>
          {group.specialty && (
            <span className="text-[11px] text-gray-400">{group.specialty}</span>
          )}
          <span className="ms-auto text-[11px] text-gray-400 tabular-nums">
            {t("count", { count: group.visits.length })}
          </span>
        </header>
      )}

      <div className="overflow-x-auto">
      <div className={cn("overflow-hidden rounded-xl border border-gray-100", showStartButton && "min-w-160")}>
        <div
          className={cn(
            "grid gap-2 border-b border-gray-100 bg-gray-50/60 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400",
            showStartButton ? GRID_ACTIONS : GRID,
          )}
        >
          <span>{tCols("queue")}</span>
          <span>{tCols("patient")}</span>
          {showStartButton && <span>{tCols("notes")}</span>}
          <span>{tCols("type")}</span>
          <span>{tCols("priority")}</span>
          <span className="text-end">{tWaiting("columns.status")}</span>
          {showStartButton && <span />}
        </div>

        <ul>
          {group.visits.map((visit) => (
            <InProgressRow
              key={visit.id}
              visit={visit}
              showStartButton={showStartButton}
              branchId={branchId}
              organizationId={organizationId}
            />
          ))}
        </ul>
      </div>
      </div>
    </div>
  );
}

function InProgressRow({
  visit,
  showStartButton,
  branchId,
  organizationId,
}: {
  visit: Visit;
  showStartButton?: boolean;
  branchId: string;
  organizationId: string;
}) {
  const t = useTranslations("visits.currentVisit");
  const router = useRouter();

  return (
    <li
      className={cn(
        "grid items-center gap-2 border-b border-gray-50 px-3 py-2.5 last:border-0 hover:bg-gray-50/40",
        showStartButton ? GRID_ACTIONS : GRID,
      )}
    >
      <span className="text-xs font-medium text-gray-500 tabular-nums">
        {visit.queueNumber ?? "—"}
      </span>
      <p className="truncate text-xs font-medium text-brand-black">
        {visit.patient.fullName}
      </p>
      {showStartButton && (
        <span className="truncate text-xs text-gray-400 italic">
          {visit.notes ?? "—"}
        </span>
      )}
      <VisitTypeBadge type={visit.type} />
      <VisitPriorityBadge priority={visit.priority} />
      <div className="flex items-center justify-end">
        <VisitStatusBadge status={visit.status} />
      </div>
      {showStartButton && (
        <div className="flex items-center justify-end">
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
            <span>{t("startVisit")}</span>
          </Button>
        </div>
      )}
    </li>
  );
}

export function InProgressByDoctorPanel({
  branchId,
  organizationId,
  filterDoctorId,
}: Props) {
  const t = useTranslations("visits.inProgress");
  const { groups, isLoading } = useBranchInProgress(branchId);

  if (!branchId || !organizationId) return null;

  const visibleGroups = filterDoctorId
    ? groups.filter((g) => g.doctorId === filterDoctorId)
    : groups;

  return (
    <section
      aria-label={t("title")}
      className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
    >
      <header className="mb-3">
        <h2 className="text-sm font-semibold text-brand-black">{t("title")}</h2>
      </header>

      {isLoading ? (
        <div className="space-y-2">
          <div className="h-10 animate-pulse rounded-lg bg-gray-50" />
          <div className="h-10 animate-pulse rounded-lg bg-gray-50" />
        </div>
      ) : visibleGroups.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-xs text-gray-400">
          {t("empty")}
        </p>
      ) : (
        <div
          className={cn(
            "grid grid-cols-1 gap-4",
            visibleGroups.length > 1 && "md:grid-cols-2",
          )}
        >
          {visibleGroups.map((group) => (
            <DoctorTable
              key={group.doctorId}
              group={group}
              showHeader={visibleGroups.length > 1}
              showStartButton={!!filterDoctorId}
              branchId={branchId}
              organizationId={organizationId}
            />
          ))}
        </div>
      )}
    </section>
  );
}
