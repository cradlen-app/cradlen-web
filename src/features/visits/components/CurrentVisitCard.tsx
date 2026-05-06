"use client";

import { Loader2, Play, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useCurrentVisit } from "../hooks/useCurrentVisit";
import { useStartVisit } from "../hooks/useStartVisit";
import { formatWaitTime } from "../lib/visits.utils";
import type { Visit } from "../types/visits.types";
import {
  VisitPriorityBadge,
  VisitStatusBadge,
  VisitTypeBadge,
} from "./VisitBadges";

type Props = {
  branchId: string | null | undefined;
  canStartVisit: boolean;
  assignedToMe?: boolean;
};

function CurrentVisitRow({
  visit,
  canStartVisit,
  branchId,
}: {
  visit: Visit;
  canStartVisit: boolean;
  branchId: string;
}) {
  const t = useTranslations("visits.currentVisit");
  const startVisit = useStartVisit();
  const canActuallyStart =
    canStartVisit && (visit.status === "waiting" || visit.status === "pending");

  async function handleStart() {
    try {
      await startVisit.mutateAsync({ branchId, visitId: visit.id });
      toast.success(t("startedToast"));
    } catch (error) {
      const message =
        error instanceof ApiError ? error.messages[0] : t("startedError");
      toast.error(message);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
        <UserRound className="size-4" aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-brand-black truncate">
          {visit.patient.fullName}
        </p>
        <p className="mt-0.5 text-[11px] text-gray-500 tabular-nums">
          #{visit.queueNumber ?? "—"} · {t("elapsed", { value: formatWaitTime(visit.startedAt ?? visit.createdAt) })}
        </p>
      </div>

      <div className="flex items-center gap-1.5">
        <VisitTypeBadge type={visit.type} />
        <VisitPriorityBadge priority={visit.priority} />
        <VisitStatusBadge status={visit.status} />
      </div>

      {canStartVisit && (
        <Button
          type="button"
          size="sm"
          onClick={handleStart}
          disabled={!canActuallyStart || startVisit.isPending}
          className={cn(
            "ms-auto rounded-full bg-brand-primary text-white hover:bg-brand-primary/90",
            "disabled:bg-brand-primary/40",
          )}
        >
          {startVisit.isPending ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Play className="size-3.5" aria-hidden="true" />
          )}
          <span>{t("startVisit")}</span>
        </Button>
      )}
    </div>
  );
}

export function CurrentVisitCard({ branchId, canStartVisit, assignedToMe }: Props) {
  const t = useTranslations("visits.currentVisit");
  const { data: visit, isLoading } = useCurrentVisit({ branchId, assignedToMe });

  return (
    <section
      aria-label={t("title")}
      className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
    >
      <header className="mb-3">
        <h2 className="text-sm font-semibold text-brand-black">{t("title")}</h2>
      </header>

      {isLoading ? (
        <div className="h-12 animate-pulse rounded-xl bg-gray-50" />
      ) : visit && branchId ? (
        <CurrentVisitRow
          visit={visit}
          canStartVisit={canStartVisit}
          branchId={branchId}
        />
      ) : (
        <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50/40 px-3 py-6 text-center text-xs text-gray-400">
          {t("empty")}
        </p>
      )}
    </section>
  );
}
