"use client";

import { Loader2, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/infrastructure/http/api";
import { cn } from "@/common/utils/utils";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { getActiveProfile } from "@/features/auth/lib/current-user";
import { canDriveClinicalVisit } from "@/features/auth/lib/permissions";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { useUnifiedMyCurrentVisit } from "../hooks/useUnifiedCurrentVisit";
import { useStartVisit } from "../hooks/useStartVisit";
import { visitWorkspacePath } from "../lib/visits.utils";
import type { Visit } from "../types/visits.types";
import { VisitPriorityBadge, VisitTypeBadge } from "./VisitBadges";

type Props = {
  branchId: string | null | undefined;
  organizationId: string | null | undefined;
};

function CurrentVisitRow({
  visit,
  branchId,
  organizationId,
}: {
  visit: Visit;
  branchId: string;
  organizationId: string;
}) {
  const t = useTranslations("visits.currentVisit");
  const startVisit = useStartVisit();
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const profile = getActiveProfile(user);
  const activeProfileId = useAuthContextStore((s) => s.profileId);

  // The patient is actively in consultation — offer Open (jump into the workspace).
  const isInConsultation = visit.status === "IN_CONSULTATION";
  // Reception has queued the patient (IN_PROGRESS); the doctor's Start button
  // begins the consultation (IN_CONSULTATION). Defense-in-depth: the my-current
  // feed is already assigned-doctor scoped, but only offer Start to the doctor
  // (or owner/manager) the backend will accept.
  const canStart =
    visit.status === "IN_PROGRESS" &&
    canDriveClinicalVisit(profile, visit.assignedDoctorId, activeProfileId);

  async function handleStart() {
    try {
      await startVisit.mutateAsync({
        branchId: visit.branchId || branchId,
        visitId: visit.id,
      });
      toast.success(t("startedToast"));
      handleOpen();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.messages[0] : t("startedError");
      toast.error(message);
    }
  }

  function handleOpen() {
    router.push(visitWorkspacePath(visit, organizationId, branchId));
  }

  return (
    <li className="grid grid-cols-[40px_minmax(0,1.5fr)_88px_84px_minmax(0,1fr)] items-center gap-3 border-b border-gray-50 px-3 py-2.5 last:border-0 hover:bg-gray-50/40">
      <span className="text-xs font-medium text-gray-500 tabular-nums">
        {visit.queueNumber ?? 1}
      </span>
      <p className="truncate text-xs font-medium text-brand-black">
        {visit.patient.fullName}
      </p>
      <VisitTypeBadge type={visit.type} />
      <VisitPriorityBadge priority={visit.priority} />
      <div className="flex items-center justify-end gap-2">
        {isInConsultation ? (
          <Button
            type="button"
            size="sm"
            onClick={handleOpen}
            className="rounded-full bg-brand-primary text-white hover:bg-brand-primary/90"
          >
            <Play className="size-3.5" aria-hidden="true" />
            <span>{t("startVisit")}</span>
          </Button>
        ) : canStart ? (
          <Button
            type="button"
            size="sm"
            onClick={handleStart}
            disabled={startVisit.isPending}
            className={cn(
              "rounded-full bg-brand-primary text-white hover:bg-brand-primary/90",
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
        ) : null}
      </div>
    </li>
  );
}

export function CurrentVisitCard({ branchId, organizationId }: Props) {
  const t = useTranslations("visits.currentVisit");
  const { data: visit, isLoading } = useUnifiedMyCurrentVisit(branchId);

  return (
    <section
      aria-label={t("title")}
      className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
    >
      <header className="mb-3">
        <h2 className="text-sm font-semibold text-brand-black">{t("title")}</h2>
      </header>

      <div className="overflow-hidden rounded-xl border border-gray-100">
        <div className="overflow-x-auto">
          <div className="min-w-[460px]">
            <div className="grid grid-cols-[40px_minmax(0,1.5fr)_88px_84px_minmax(0,1fr)] gap-3 border-b border-gray-100 bg-gray-50/60 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              <span>{t("columns.id")}</span>
              <span>{t("columns.name")}</span>
              <span>{t("columns.type")}</span>
              <span>{t("columns.priority")}</span>
              <span className="text-end"></span>
            </div>

            {isLoading ? (
              <div className="space-y-1 p-3">
                <div className="h-10 animate-pulse rounded-lg bg-gray-50" />
              </div>
            ) : visit.length > 0 && branchId && organizationId ? (
              <ul>
                {visit.map((v) => (
                  <CurrentVisitRow
                    key={v.id}
                    visit={v}
                    branchId={branchId}
                    organizationId={organizationId}
                  />
                ))}
              </ul>
            ) : (
              <p className="px-4 py-8 text-center text-xs text-gray-400">
                {t("empty")}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
