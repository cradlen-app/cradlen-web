"use client";

import { AlertTriangle, Bell, MessageSquare, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

interface Props {
  patientId: string;
  onNavigateToHistory: (sectionCode: string) => void;
}

export function VisitContextRail(_props: Props) {
  const t = useTranslations("visits.workspace.rail");

  return (
    <aside className="h-full divide-y divide-gray-100 overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
      {/* ── Red Flags (placeholder) ── */}
      <section className="p-4">
        <header className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-red-600" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-red-600">
            {t("redFlags.title")}
          </h3>
        </header>
        <p className="mt-3 text-xs italic text-gray-400">
          {t("redFlags.empty")}
        </p>
      </section>

      {/* ── Alerts (placeholder) ── */}
      <section className="p-4">
        <header className="flex items-center gap-2">
          <Bell className="size-4 text-amber-600" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-amber-600">
            {t("alerts.title")}
          </h3>
        </header>
        <p className="mt-3 text-xs text-gray-400">{t("alerts.empty")}</p>
      </section>

      {/* ── Repeated Compliments (placeholder) ── */}
      <section className="p-4">
        <header className="flex items-center gap-2">
          <Sparkles className="size-4 text-brand-primary" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-brand-primary">
            {t("compliments.title")}
          </h3>
        </header>
        <p className="mt-3 text-xs text-gray-400">{t("compliments.empty")}</p>
      </section>

      {/* ── Comments (placeholder) ── */}
      <section className="p-4">
        <header className="flex items-center gap-2">
          <MessageSquare className="size-4 text-gray-500" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-gray-500">
            {t("comments.title")}
          </h3>
        </header>
        <p className="mt-3 text-xs text-gray-400">{t("comments.empty")}</p>
      </section>
    </aside>
  );
}
