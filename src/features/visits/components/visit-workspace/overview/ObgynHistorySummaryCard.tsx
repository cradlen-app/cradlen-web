"use client";

import { BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { useObgynHistorySummary } from "@/features/patient-history/api/useObgynHistorySummary";
import {
  buildClinicalDigest,
  type ClinicalFlag,
  type SignalSeverity,
} from "@/features/patient-history/lib/clinical-digest/index";

type Props = { patientId: string; patientDateOfBirth?: string };

const FLAG_STYLES: Record<SignalSeverity, string> = {
  high: "bg-red-50 text-red-700 border border-red-100",
  medium: "bg-amber-50 text-amber-700 border border-amber-100",
  low: "bg-gray-100 text-gray-600",
  positive: "bg-green-50 text-green-700 border border-green-100",
};

function FlagChip({ flag }: { flag: ClinicalFlag }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${FLAG_STYLES[flag.severity]}`}
    >
      {flag.label}
    </span>
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

export function ObgynHistorySummaryCard({ patientId, patientDateOfBirth }: Props) {
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
        <DigestView data={data} patientDateOfBirth={patientDateOfBirth} />
      )}
    </section>
  );
}

function DigestView({
  data,
  patientDateOfBirth,
}: {
  data: Parameters<typeof buildClinicalDigest>[0];
  patientDateOfBirth?: string;
}) {
  const digest = buildClinicalDigest(data, patientDateOfBirth);

  return (
    <div className="mt-4 space-y-3">
      <p className="text-sm font-semibold text-brand-primary">{digest.header}</p>

      {digest.flags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {digest.flags.map((flag, i) => (
            <FlagChip key={i} flag={flag} />
          ))}
        </div>
      )}

      <p className="text-xs leading-relaxed text-gray-600">{digest.summary}</p>
    </div>
  );
}
