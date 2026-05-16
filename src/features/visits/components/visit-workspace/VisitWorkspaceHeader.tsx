"use client";

import { CheckCircle2, ChevronRight, Loader2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/common/utils/utils";
import type { Visit } from "../../types/visits.types";
import {
  VisitPriorityBadge,
  VisitStatusBadge,
  VisitTypeBadge,
} from "../VisitBadges";

type Props = {
  visit: Visit;
  organizationId: string;
  branchId: string;
  canComplete: boolean;
  canCancel: boolean;
  isMutating: boolean;
  onComplete: () => void;
  onCancel: () => void;
};

function shortVisitId(id: string) {
  return `#${id.replace(/-/g, "").slice(0, 16)}`;
}

export function VisitWorkspaceHeader({
  visit,
  organizationId,
  branchId,
  canComplete,
  canCancel,
  isMutating,
  onComplete,
  onCancel,
}: Props) {
  const t = useTranslations("visits.workspace.header");
  const patientsHref =
    `/${organizationId}/${branchId}/dashboard/patients` as const;

  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-brand-black">
          {t("title")}
        </h1>
        <nav
          aria-label={t("breadcrumbAria")}
          className="mt-1 flex flex-wrap items-center gap-1 text-xs text-gray-500"
        >
          <Link
            href={patientsHref as Parameters<typeof Link>[0]["href"]}
            className="hover:text-brand-primary"
          >
            {t("crumbPatients")}
          </Link>
          <ChevronRight
            className="size-3 text-gray-300 rtl:rotate-180"
            aria-hidden="true"
          />
          <span className="font-medium text-gray-600">
            {shortVisitId(visit.id)}
          </span>
          <ChevronRight
            className="size-3 text-gray-300 rtl:rotate-180"
            aria-hidden="true"
          />
          <span className="text-brand-primary">
            {t(`crumbVisit.${visit.type}`)}
          </span>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {canCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isMutating}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full border border-red-200 bg-white px-4 text-xs font-semibold text-red-600",
              "hover:bg-red-50 disabled:opacity-60",
            )}
          >
            <XCircle className="size-3.5" aria-hidden="true" />
            {t("cancelVisit")}
          </button>
        )}
        {canComplete && (
          <button
            type="button"
            onClick={onComplete}
            disabled={isMutating}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-primary px-4 text-xs font-semibold text-white",
              "hover:bg-brand-primary/90 disabled:opacity-60",
            )}
          >
            {isMutating ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
            )}
            {t("complete")}
          </button>
        )}
      </div>
    </header>
  );
}
