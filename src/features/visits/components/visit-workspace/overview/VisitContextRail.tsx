"use client";

import {
  AlertTriangle,
  Bell,
  ExternalLink,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useFieldFlags } from "@/features/patient-history/api/useFieldFlags";
import type { FieldFlagDto } from "@/features/patient-history/api/field-flags.api";

interface Props {
  patientId: string;
  onNavigateToHistory: (sectionCode: string) => void;
}

function toTitleCase(str: string): string {
  return str
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function groupBySection(
  flags: FieldFlagDto[],
): Record<string, FieldFlagDto[]> {
  return flags.reduce<Record<string, FieldFlagDto[]>>((acc, flag) => {
    (acc[flag.section_code] ??= []).push(flag);
    return acc;
  }, {});
}

function RedFlagsSkeleton() {
  return (
    <div className="mt-2 space-y-2">
      {[80, 60, 75, 50].map((w, i) => (
        <div
          key={i}
          className="h-3 animate-pulse rounded bg-gray-100"
          style={{ width: `${w}%` }}
        />
      ))}
    </div>
  );
}

export function VisitContextRail({ patientId, onNavigateToHistory }: Props) {
  const t = useTranslations("visits.workspace.rail");
  const { data: flags, isLoading, isError } = useFieldFlags(patientId);

  const grouped = flags ? groupBySection(flags) : {};
  const hasFlags = flags && flags.length > 0;

  return (
    <aside className="h-full divide-y divide-gray-100 overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
      {/* ── Red Flags (live data) ── */}
      <section className="p-4">
        <header className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-red-600" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-red-600">
            {t("redFlags.title")}
          </h3>
        </header>

        {isLoading ? (
          <RedFlagsSkeleton />
        ) : isError ? (
          <p className="mt-3 text-xs text-red-400">
            Failed to load red flags.
          </p>
        ) : !hasFlags ? (
          <p className="mt-3 text-xs italic text-gray-400">
            {t("redFlags.empty")}
          </p>
        ) : (
          <div className="mt-3 space-y-4">
            {Object.entries(grouped).map(([sectionCode, sectionFlags]) => (
              <div key={sectionCode}>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  {toTitleCase(sectionCode)}
                </p>
                <ul className="space-y-1">
                  {sectionFlags.map((flag) => (
                    <li
                      key={flag.id}
                      className="group flex items-start gap-1.5 rounded-md px-1.5 py-1 hover:bg-gray-50"
                    >
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-red-500" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs leading-snug text-gray-800">
                          {flag.note ?? toTitleCase(flag.field_code)}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {flag.field_code}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigateToHistory(flag.section_code)}
                        aria-label={`Go to ${toTitleCase(sectionCode)} in History`}
                        className="mt-0.5 shrink-0 rounded border border-gray-200 bg-white p-0.5 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 hover:border-gray-300 hover:text-gray-600 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1"
                        title={`Go to ${toTitleCase(sectionCode)} in History`}
                      >
                        <ExternalLink className="size-3" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
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
          <Sparkles
            className="size-4 text-brand-primary"
            aria-hidden="true"
          />
          <h3 className="text-sm font-semibold text-brand-primary">
            {t("compliments.title")}
          </h3>
        </header>
        <p className="mt-3 text-xs text-gray-400">{t("compliments.empty")}</p>
      </section>

      {/* ── Comments (placeholder) ── */}
      <section className="p-4">
        <header className="flex items-center gap-2">
          <MessageSquare
            className="size-4 text-gray-500"
            aria-hidden="true"
          />
          <h3 className="text-sm font-semibold text-gray-500">
            {t("comments.title")}
          </h3>
        </header>
        <p className="mt-3 text-xs text-gray-400">{t("comments.empty")}</p>
      </section>
    </aside>
  );
}
