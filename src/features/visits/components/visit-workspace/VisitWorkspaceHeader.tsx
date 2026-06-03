"use client";

import { CheckCircle2, ChevronLeft, Loader2, Receipt } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
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
  const dashboardHref = `/${organizationId}/${branchId}/dashboard` as const;
  const patientsHref =
    `/${organizationId}/${branchId}/dashboard/patients` as const;
  const patientHref =
    `/${organizationId}/${branchId}/dashboard/patients/${visit.patient.id}` as const;

  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <Link
            href={dashboardHref as Parameters<typeof Link>[0]["href"]}
            aria-label={t("backToVisits")}
            className="inline-flex size-7 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-brand-black"
          >
            <ChevronLeft className="size-5 rtl:rotate-180" aria-hidden="true" />
          </Link>
          <h1 className="text-2xl font-semibold text-brand-black">
            {t("title")}
          </h1>
        </div>
        <Breadcrumbs
          ariaLabel={t("breadcrumbAria")}
          className="mt-1"
          items={[
            { label: t("crumbPatients"), href: patientsHref },
            { label: visit.patient.fullName, href: patientHref },
            { label: t("crumbVisitCurrent") },
          ]}
        />
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
            {t("invoice")}
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
