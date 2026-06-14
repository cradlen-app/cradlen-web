"use client";

import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/common/utils/utils";
import type {
  PrescriptionBlockType,
  PrescriptionDocument,
} from "../../types/visits.api.types";

// One presentational component per block type. The document renderer maps the
// template's ordered `layout.blocks` through this registry, so adding a block
// kind (for a future custom template) is: add a type + a component here.

export type BlockProps = { document: PrescriptionDocument };

function formatDate(value: string | null | undefined, locale: string): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString(locale);
}

function computeAge(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  const age = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  return age >= 0 && age < 150 ? age : null;
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <span className="text-sm text-brand-black">{value}</span>
    </div>
  );
}

export function HeaderBlock({ document }: BlockProps) {
  const { organization, branch } = document;
  const cityLine = [branch.city, branch.governorate].filter(Boolean).join(", ");
  return (
    <div className="text-center">
      {organization.logo_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={organization.logo_image_url}
          alt={organization.name}
          className="mx-auto mb-2 h-16 w-auto object-contain"
        />
      ) : null}
      <h2 className="text-lg font-semibold text-brand-primary">
        {organization.name}
      </h2>
      <p className="text-xs text-gray-500">
        {[branch.name, cityLine].filter(Boolean).join(" · ")}
      </p>
      {branch.address ? (
        <p className="text-xs text-gray-400">{branch.address}</p>
      ) : null}
    </div>
  );
}

export function DoctorBlock({ document }: BlockProps) {
  const t = useTranslations("visits.prescription");
  const locale = useLocale();
  const { doctor } = document;
  return (
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div>
        <p className="text-sm font-semibold text-brand-black">{doctor.name}</p>
        {doctor.specialty ? (
          <p className="text-xs text-gray-500">{doctor.specialty}</p>
        ) : null}
        {doctor.license_number ? (
          <p className="text-xs text-gray-400">
            {t("license")}: {doctor.license_number}
          </p>
        ) : null}
      </div>
      <MetaRow
        label={t("date")}
        value={formatDate(document.prescribed_at, locale)}
      />
    </div>
  );
}

export function PatientBlock({ document }: BlockProps) {
  const t = useTranslations("visits.prescription");
  const { patient } = document;
  const age = computeAge(patient.date_of_birth);
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <MetaRow label={t("patient")} value={patient.full_name} />
        {age != null ? (
          <MetaRow label={t("age")} value={t("years", { count: age })} />
        ) : null}
        {patient.phone_number ? (
          <MetaRow label={t("phone")} value={patient.phone_number} />
        ) : null}
      </div>
    </div>
  );
}

export function DiagnosisBlock({ document }: BlockProps) {
  const t = useTranslations("visits.prescription");
  const { diagnosis } = document;
  if (!diagnosis.chief_complaint && !diagnosis.provisional_diagnosis) return null;
  return (
    <div className="space-y-1">
      {diagnosis.chief_complaint ? (
        <MetaRow label={t("complaint")} value={diagnosis.chief_complaint} />
      ) : null}
      {diagnosis.provisional_diagnosis ? (
        <MetaRow label={t("diagnosis")} value={diagnosis.provisional_diagnosis} />
      ) : null}
    </div>
  );
}

export function MedicationsBlock({ document }: BlockProps) {
  const t = useTranslations("visits.prescription");
  const { items } = document;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="font-serif text-2xl leading-none text-brand-primary">
          ℞
        </span>
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {t("medications")}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400">{t("noMedications")}</p>
      ) : (
        <ol className="space-y-3">
          {items.map((item, i) => {
            const subtitle = [item.strength, item.form]
              .filter(Boolean)
              .join(" · ");
            const regimen = [item.dose, item.frequency, item.duration]
              .filter(Boolean)
              .join(" · ");
            return (
              <li key={i} className="flex gap-2">
                <span className="text-sm font-semibold text-gray-400 tabular-nums">
                  {i + 1}.
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-brand-black">
                    {item.name}
                    {subtitle ? (
                      <span className="font-normal text-gray-400">
                        {" "}
                        ({subtitle})
                      </span>
                    ) : null}
                  </p>
                  {regimen ? (
                    <p className="text-sm text-gray-600">{regimen}</p>
                  ) : null}
                  {item.instructions ? (
                    <p className="text-xs text-gray-500">{item.instructions}</p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

export function NotesBlock({ document }: BlockProps) {
  const t = useTranslations("visits.prescription");
  if (!document.notes) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {t("notes")}
      </p>
      <p className="text-sm text-gray-700">{document.notes}</p>
    </div>
  );
}

export function SignatureBlock({ document }: BlockProps) {
  const t = useTranslations("visits.prescription");
  return (
    <div className="flex justify-end pt-6">
      <div className="text-center">
        <div className="h-10 w-44 border-b border-gray-300" />
        <p className="pt-1 text-xs text-gray-500">
          {t("signature")} — {document.doctor.name}
        </p>
      </div>
    </div>
  );
}

export function FooterBlock({ document }: BlockProps) {
  const cityLine = [document.branch.city, document.branch.governorate]
    .filter(Boolean)
    .join(", ");
  return (
    <p className="pt-2 text-center text-[11px] text-gray-400">
      {[document.organization.name, document.branch.name, cityLine]
        .filter(Boolean)
        .join(" · ")}
    </p>
  );
}

/** Block registry — the data-driven core. A template's layout references these. */
export const PRESCRIPTION_BLOCKS: Record<
  PrescriptionBlockType,
  (props: BlockProps) => React.ReactElement | null
> = {
  header: HeaderBlock,
  doctor: DoctorBlock,
  patient: PatientBlock,
  diagnosis: DiagnosisBlock,
  medications: MedicationsBlock,
  notes: NotesBlock,
  signature: SignatureBlock,
  footer: FooterBlock,
};

/** Divider classes applied between rendered blocks (skips the first). */
export function blockSeparatorClass(index: number): string {
  return cn(index > 0 && "border-t border-dashed border-gray-200 pt-4");
}
