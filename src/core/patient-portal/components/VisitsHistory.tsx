"use client";

import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";

import { useVisitHistory } from "../hooks/usePortalData";
import { VisitTimeline } from "./VisitTimeline";

/**
 * Visit history timeline for the patient portal Record screen. A thin wrapper
 * around the shared {@link VisitTimeline}: the same timeline is reused on the
 * Visits page so both stay in sync. Keeps its own scroll container so the card
 * fills the Record tab.
 */
export function VisitsHistory() {
  const t = useTranslations("patientPortal");
  const visits = useVisitHistory();

  return (
    <section className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <header className="mb-4 flex items-center gap-2">
        <Clock className="size-4 text-brand-primary" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-brand-black">
          {t("record.historyTitle")}
        </h2>
      </header>

      <VisitTimeline
        {...visits}
        listClassName="min-h-0 flex-1 overflow-y-auto"
      />
    </section>
  );
}
