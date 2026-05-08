"use client";

import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
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
};

const GRID =
  "grid-cols-[36px_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto]";

function DoctorTable({
  group,
  showHeader,
  branchId,
  organizationId,
}: {
  group: DoctorGroup;
  showHeader: boolean;
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

      <div className="overflow-hidden rounded-xl border border-gray-100">
        <div
          className={cn(
            "grid gap-2 border-b border-gray-100 bg-gray-50/60 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400",
            GRID,
          )}
        >
          <span>{tCols("queue")}</span>
          <span>{tCols("patient")}</span>
          <span>{tCols("type")}</span>
          <span>{tCols("priority")}</span>
          <span className="text-end">{tWaiting("columns.status")}</span>
        </div>

        <ul>
          {group.visits.map((visit) => (
            <InProgressRow
              key={visit.id}
              visit={visit}
              branchId={branchId}
              organizationId={organizationId}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}

function InProgressRow({
  visit,
  branchId,
  organizationId,
}: {
  visit: Visit;
  branchId: string;
  organizationId: string;
}) {
  const t = useTranslations("visits.inProgress");

  return (
    <li
      className={cn(
        "grid items-center gap-2 border-b border-gray-50 px-3 py-2.5 last:border-0 hover:bg-gray-50/40",
        GRID,
      )}
    >
      <span className="text-xs font-medium text-gray-500 tabular-nums">
        {visit.queueNumber ?? "—"}
      </span>
      <p className="truncate text-xs font-medium text-brand-black">
        {visit.patient.fullName}
      </p>
      <VisitTypeBadge type={visit.type} />
      <VisitPriorityBadge priority={visit.priority} />
      <div className="flex items-center justify-end">
        <VisitStatusBadge status={visit.status} />
      </div>
    </li>
  );
}

export function InProgressByDoctorPanel({ branchId, organizationId }: Props) {
  const t = useTranslations("visits.inProgress");
  const { groups, isLoading } = useBranchInProgress(branchId);

  if (!branchId || !organizationId) return null;

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
      ) : groups.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-xs text-gray-400">
          {t("empty")}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {groups.map((group) => (
            <DoctorTable
              key={group.doctorId}
              group={group}
              showHeader={groups.length > 1}
              branchId={branchId}
              organizationId={organizationId}
            />
          ))}
        </div>
      )}
    </section>
  );
}
