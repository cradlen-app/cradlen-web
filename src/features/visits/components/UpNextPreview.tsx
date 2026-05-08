"use client";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useDashboardPath } from "@/hooks/useDashboardPath";
import { cn } from "@/lib/utils";
import { useWaitingList } from "../hooks/useWaitingList";
import { formatWaitTime } from "../lib/visits.utils";
import { VisitPriorityBadge, VisitTypeBadge } from "./VisitBadges";

type Props = {
  branchId: string | null | undefined;
  assignedToMe?: boolean;
};

export function UpNextPreview({ branchId, assignedToMe }: Props) {
  const t = useTranslations("dashboardHome.upNext");
  const dashboardPath = useDashboardPath();
  const { data, isLoading } = useWaitingList({
    branchId,
    assignedToMe,
    page: 1,
    limit: 3,
  });

  const previewRows = data?.rows ?? [];

  return (
    <section
      aria-label={t("title")}
      className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
    >
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-brand-black">{t("title")}</h2>
        <Link
          href={dashboardPath("/visits") as Parameters<typeof Link>[0]["href"]}
          className={cn(
            "inline-flex items-center gap-1 text-xs font-medium text-brand-primary hover:underline",
          )}
        >
          {t("viewAll")}
          <ArrowRight className="size-3.5 rtl:rotate-180" aria-hidden="true" />
        </Link>
      </header>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-50" />
          ))}
        </div>
      ) : previewRows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50/40 px-3 py-6 text-center text-xs text-gray-400">
          {t("empty")}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {previewRows.map((visit) => (
            <li
              key={visit.id}
              className="flex items-center gap-3 rounded-xl border border-gray-50 px-3 py-2 hover:bg-gray-50/40"
            >
              <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-[11px] font-semibold text-brand-primary tabular-nums">
                {visit.queueNumber ?? "—"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-brand-black truncate">
                  {visit.patient.fullName}
                </p>
                <p className="mt-0.5 text-[10px] text-gray-400 tabular-nums">
                  {formatWaitTime(visit.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <VisitTypeBadge type={visit.type} />
                <VisitPriorityBadge priority={visit.priority} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
