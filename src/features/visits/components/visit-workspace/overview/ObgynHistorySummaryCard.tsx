"use client";

import { BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { useObgynHistorySummary } from "@/features/patient-history/api/useObgynHistorySummary";
import type {
  AllergySnapshot,
  MedicationSnapshot,
  ObstetricSummary,
  GynecologicalBaseline,
  ChronicIllnesses,
  FamilyHistory,
  SocialHistory,
  ScreeningHistory,
} from "@/features/patient-history/api/obgyn-history-summary.api";

type Props = { patientId: string };

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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
      {children}
    </p>
  );
}

function KVRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-brand-black">{value}</span>
    </div>
  );
}

function AllergiesList({ allergies }: { allergies: AllergySnapshot[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {allergies.map((a, i) => (
        <span
          key={i}
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
            a.severity === "SEVERE"
              ? "bg-red-100 text-red-700"
              : a.severity === "MODERATE"
                ? "bg-orange-100 text-orange-700"
                : "bg-yellow-50 text-yellow-700"
          }`}
        >
          {a.allergy_to}
          {a.severity ? ` · ${a.severity.toLowerCase()}` : ""}
        </span>
      ))}
    </div>
  );
}

function MedicationsList({ medications }: { medications: MedicationSnapshot[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {medications.map((m, i) => (
        <span
          key={i}
          className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700"
        >
          {m.drug_name}
          {m.dose ? ` ${m.dose}` : ""}
          {m.frequency
            ? ` · ${m.frequency.replace(/_/g, " ").toLowerCase()}`
            : ""}
        </span>
      ))}
    </div>
  );
}

function ObstetricRow({ obs }: { obs: ObstetricSummary }) {
  return (
    <div className="flex gap-4 text-xs">
      <span className="font-semibold text-brand-primary">G{obs.gravida}</span>
      <span className="font-semibold text-brand-primary">P{obs.para}</span>
      <span className="font-semibold text-brand-primary">A{obs.abortion}</span>
      {obs.ectopic > 0 && (
        <span className="text-gray-500">Ectopic: {obs.ectopic}</span>
      )}
      {obs.stillbirths > 0 && (
        <span className="text-gray-500">SB: {obs.stillbirths}</span>
      )}
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
        <div className="mt-4 space-y-4">
          {/* Allergies */}
          <div>
            <SectionLabel>{t("allergies")}</SectionLabel>
            {data.allergies.length > 0 ? (
              <AllergiesList allergies={data.allergies} />
            ) : (
              <p className="text-xs italic text-gray-400">{t("noAllergies")}</p>
            )}
          </div>

          {/* Medications */}
          <div>
            <SectionLabel>{t("medications")}</SectionLabel>
            {data.current_medications.length > 0 ? (
              <MedicationsList medications={data.current_medications} />
            ) : (
              <p className="text-xs italic text-gray-400">{t("noMedications")}</p>
            )}
          </div>

          {/* Obstetric summary */}
          {data.obstetric_summary !== null && (
            <div>
              <SectionLabel>{t("obstetric")}</SectionLabel>
              <ObstetricRow obs={data.obstetric_summary as ObstetricSummary} />
            </div>
          )}

          {/* Gynecological baseline */}
          {data.gynecological_baseline !== null && (
            <GynecologicalSection
              baseline={data.gynecological_baseline as GynecologicalBaseline}
              labels={{ menarche: t("menarche"), cycle: t("cycleRegularity"), dysmenorrhea: t("dysmenorrhea"), yes: t("yes"), no: t("no") }}
              sectionLabel={t("gynecological")}
            />
          )}

          {/* Chronic illnesses */}
          {data.medical_chronic_illnesses !== null && (
            <ChronicSection
              data={data.medical_chronic_illnesses as ChronicIllnesses}
              label={t("chronicIllnesses")}
            />
          )}

          {/* Family history */}
          {data.family_history !== null && (
            <FamilySection
              data={data.family_history as FamilyHistory}
              label={t("familyHistory")}
            />
          )}

          {/* Social history */}
          {data.social_history !== null && (
            <SocialSection
              data={data.social_history as SocialHistory}
              labels={{ section: t("socialHistory"), smoking: t("smoking"), alcohol: t("alcohol") }}
            />
          )}

          {/* Screening */}
          {data.screening_history !== null && (
            <ScreeningSection
              data={data.screening_history as ScreeningHistory}
              labels={{ section: t("screening"), papSmear: t("papSmear"), mammography: t("mammography"), notDone: t("notDone") }}
            />
          )}
        </div>
      )}
    </section>
  );
}

function GynecologicalSection({
  baseline,
  labels,
  sectionLabel,
}: {
  baseline: GynecologicalBaseline;
  labels: { menarche: string; cycle: string; dysmenorrhea: string; yes: string; no: string };
  sectionLabel: string;
}) {
  return (
    <div>
      <SectionLabel>{sectionLabel}</SectionLabel>
      <div className="space-y-1">
        <KVRow label={labels.menarche} value={String(baseline.age_at_menarche)} />
        <KVRow
          label={labels.cycle}
          value={baseline.cycle_regularity.replace(/_/g, " ").toLowerCase()}
        />
        <KVRow
          label={labels.dysmenorrhea}
          value={baseline.dysmenorrhea ? labels.yes : labels.no}
        />
      </div>
    </div>
  );
}

function ChronicSection({ data, label }: { data: ChronicIllnesses; label: string }) {
  if (data.items.length === 0) return null;
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <p className="text-xs text-gray-700">{data.items.join(", ")}</p>
    </div>
  );
}

function FamilySection({ data, label }: { data: FamilyHistory; label: string }) {
  const all = [...data.gynecologic_cancers, ...data.chronic_illnesses];
  if (all.length === 0) return null;
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <p className="text-xs text-gray-700">{all.join(", ")}</p>
    </div>
  );
}

function SocialSection({
  data,
  labels,
}: {
  data: SocialHistory;
  labels: { section: string; smoking: string; alcohol: string };
}) {
  return (
    <div>
      <SectionLabel>{labels.section}</SectionLabel>
      <div className="space-y-1">
        <KVRow label={labels.smoking} value={data.smoking.replace(/_/g, " ").toLowerCase()} />
        <KVRow label={labels.alcohol} value={data.alcohol.replace(/_/g, " ").toLowerCase()} />
      </div>
    </div>
  );
}

function ScreeningSection({
  data,
  labels,
}: {
  data: ScreeningHistory;
  labels: { section: string; papSmear: string; mammography: string; notDone: string };
}) {
  return (
    <div>
      <SectionLabel>{labels.section}</SectionLabel>
      <div className="space-y-1">
        <KVRow
          label={labels.papSmear}
          value={
            data.pap_smear
              ? `${data.pap_smear.toLowerCase()}${data.pap_smear_date ? ` (${data.pap_smear_date})` : ""}`
              : labels.notDone
          }
        />
        {data.mammography !== null && (
          <KVRow
            label={labels.mammography}
            value={`${data.mammography.toLowerCase()}${data.mammography_date ? ` (${data.mammography_date})` : ""}`}
          />
        )}
      </div>
    </div>
  );
}
