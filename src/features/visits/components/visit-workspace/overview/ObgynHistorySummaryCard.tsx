"use client";

import { BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { useObgynHistorySummary } from "@/features/patient-history/api/useObgynHistorySummary";
import type {
  HistorySummaryFlag,
  HistorySummarySection,
  ObgynHistorySummary,
  SummarySignalSeverity,
} from "@/features/patient-history/api/obgyn-history-summary.api";

type Props = { patientId: string; patientDateOfBirth?: string };

const FLAG_STYLES: Record<SummarySignalSeverity, string> = {
  high: "bg-red-50 text-red-700 border border-red-100",
  medium: "bg-amber-50 text-amber-700 border border-amber-100",
  low: "bg-gray-100 text-gray-600",
  positive: "bg-green-50 text-green-700 border border-green-100",
};

function FlagChip({ flag }: { flag: HistorySummaryFlag }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${FLAG_STYLES[flag.severity]}`}
    >
      {flag.label}
    </span>
  );
}

function SectionRow({ section }: { section: HistorySummarySection }) {
  const dim = section.status === "negative";
  return (
    <div className="flex gap-1.5 text-xs">
      <span className="shrink-0 font-medium text-gray-500">
        {section.label}:
      </span>
      <span className={dim ? "italic text-gray-400" : "text-gray-700"}>
        {section.items.join(", ")}
      </span>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="mt-3 space-y-2">
      {[85, 65, 75].map((w, i) => (
        <div
          key={i}
          className="h-3 animate-pulse rounded bg-gray-100"
          style={{ width: `${w}%` }}
        />
      ))}
    </div>
  );
}

export function ObgynHistorySummaryCard({ patientId }: Props) {
  const t = useTranslations("visits.workspace.obgynSummary");
  const { data, isLoading, isError } = useObgynHistorySummary(patientId);

  return (
    <section>
      <header className="flex items-center gap-2">
        <BookOpen className="size-4 text-brand-primary" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-brand-black">{t("title")}</h2>
      </header>

      {isLoading ? (
        <Skeleton />
      ) : isError || !data ? (
        <p className="mt-3 text-xs text-red-400">{t("noHistory")}</p>
      ) : !data.history_exists ? (
        <p className="mt-3 text-xs italic text-gray-400">{t("noHistory")}</p>
      ) : (
        <SummaryView data={data} />
      )}
    </section>
  );
}

function SummaryView({ data }: { data: ObgynHistorySummary }) {
  const { identifier, flags, sections } = data;
  const headerParts = [
    identifier.gtpal_label,
    identifier.lmp ? `LMP ${identifier.lmp}` : null,
    identifier.blood_group_rh,
  ].filter(Boolean);

  return (
    <div className="my-4 space-y-3">
      <p className="text-sm font-semibold text-brand-primary">
        {headerParts.join(" • ") || "—"}
      </p>

      {flags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {flags.map((flag, i) => (
            <FlagChip key={i} flag={flag} />
          ))}
        </div>
      )}

      <div className="space-y-1">
        {sections.map((section) => (
          <SectionRow key={section.code} section={section} />
        ))}
      </div>
    </div>
  );
}
