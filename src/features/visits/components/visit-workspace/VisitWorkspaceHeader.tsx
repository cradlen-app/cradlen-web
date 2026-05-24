"use client";

import { CheckCircle2, ChevronRight, Loader2, Receipt } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/common/utils/utils";
import type { Visit } from "../../types/visits.types";

type Props = {
  visit: Visit;
  organizationId: string;
  branchId: string;
  canComplete: boolean;
  isMutating: boolean;
  onComplete: () => void;
  showInvoice: boolean;
  onInvoice: () => void;
};

function shortVisitId(id: string) {
  return `#${id.replace(/-/g, "").slice(0, 16)}`;
}

export function VisitWorkspaceHeader({
  visit,
  organizationId,
  branchId,
  canComplete,
  isMutating,
  onComplete,
  showInvoice,
  onInvoice,
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
        {showInvoice && (
          <button
            type="button"
            onClick={onInvoice}
            disabled={isMutating}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 text-xs font-semibold text-gray-700",
              "hover:bg-gray-50 disabled:opacity-60",
            )}
          >
            <Receipt className="size-3.5" aria-hidden="true" />
            Invoice
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
