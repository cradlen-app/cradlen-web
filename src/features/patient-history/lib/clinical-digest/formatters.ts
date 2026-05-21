import type {
  ObgynHistorySummary,
  ObstetricSummary,
  GynecologicalBaseline,
  ChronicIllnesses,
  FamilyHistory,
  SocialHistory,
  ScreeningHistory,
  MedicationSnapshot,
} from "../../api/obgyn-history-summary.api";
import type { ClinicalSignal } from "./types";

export function humanJoin(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export function obstetricLabel(obs: ObstetricSummary): string {
  const g = obs.gravida ?? 0;
  const p = obs.para ?? 0;
  const a = obs.abortion ?? 0;
  const e = obs.ectopic ?? 0;
  const sb = obs.stillbirths ?? 0;
  let label = `G${g}P${p}A${a}`;
  if (e > 0) label += ` Ect:${e}`;
  if (sb > 0) label += ` SB:${sb}`;
  return label;
}

export function buildNarrative(history: ObgynHistorySummary): string {
  const sentences: string[] = [];

  // 1. Menstrual — clause-based composition
  const gyn = history.gynecological_baseline as GynecologicalBaseline | null;
  if (gyn) {
    const regularity = gyn.cycle_regularity.replace(/_/g, " ").toLowerCase();
    const menarchePart = gyn.age_at_menarche
      ? `since menarche at age ${gyn.age_at_menarche}`
      : null;
    const dysPart = gyn.dysmenorrhea ? "with dysmenorrhea" : "without dysmenorrhea";
    const cycleSentence = [
      `${regularity.charAt(0).toUpperCase() + regularity.slice(1)} menstrual cycles`,
      menarchePart,
      dysPart,
    ]
      .filter(Boolean)
      .join(" ");
    sentences.push(`${cycleSentence}.`);
  }

  // 2. Obstetric history
  const obs = history.obstetric_summary as ObstetricSummary | null;
  if (obs) {
    const gravida = obs.gravida ?? 0;
    const ectopic = obs.ectopic ?? 0;
    const stillbirths = obs.stillbirths ?? 0;
    if (gravida === 0) {
      sentences.push("No prior pregnancies.");
    } else {
      const detail: string[] = [];
      if (ectopic > 0)
        detail.push(`${ectopic} ectopic pregnanc${ectopic === 1 ? "y" : "ies"}`);
      if (stillbirths > 0)
        detail.push(`${stillbirths} stillbirth${stillbirths > 1 ? "s" : ""}`);
      const suffix = detail.length > 0 ? ` including ${humanJoin(detail)}` : "";
      sentences.push(`${obstetricLabel(obs)}${suffix}.`);
    }
  }

  // 3. Current medications
  const meds = history.current_medications as MedicationSnapshot[];
  if (meds.length > 0) {
    const list = meds
      .map((m) => m.drug_name + (m.dose ? ` ${m.dose}` : ""))
      .join(", ");
    sentences.push(`Currently on ${list}.`);
  }

  // 4. Allergies
  if (history.allergies.length > 0) {
    const list = history.allergies.map(
      (a) => a.allergy_to + (a.severity ? ` (${a.severity.toLowerCase()})` : ""),
    );
    sentences.push(
      `Known ${humanJoin(list)} allerg${list.length === 1 ? "y" : "ies"}.`,
    );
  }

  // 5. Chronic illnesses
  const chronic = history.medical_chronic_illnesses as ChronicIllnesses | null;
  if (chronic && chronic.items.length > 0) {
    sentences.push(`Chronic conditions: ${humanJoin(chronic.items)}.`);
  }

  // 6. Family history
  const fh = history.family_history as FamilyHistory | null;
  if (fh) {
    const all = [...fh.gynecologic_cancers, ...fh.chronic_illnesses];
    if (all.length > 0)
      sentences.push(`Family history of ${humanJoin(all)}.`);
  }

  // 7. Social — smoking only if not never/non-smoker
  const social = history.social_history as SocialHistory | null;
  if (social) {
    const s = social.smoking.toUpperCase();
    const isNever = ["NEVER", "NON_SMOKER", "NEVER_SMOKER", "NO"].some((v) =>
      s.includes(v),
    );
    if (!isNever) {
      sentences.push(s.includes("CURRENT") ? "Current smoker." : "Former smoker.");
    }
  }

  // 8. Screening
  const screen = history.screening_history as ScreeningHistory | null;
  if (screen) {
    if (screen.pap_smear) {
      const date = screen.pap_smear_date ? ` (${screen.pap_smear_date})` : "";
      sentences.push(
        `Cervical screening ${screen.pap_smear.toLowerCase()}${date}.`,
      );
    } else {
      sentences.push("Cervical screening not performed.");
    }
  }

  // 9. Aggregate negatives with Oxford comma
  const negatives: string[] = [];
  if (meds.length === 0) negatives.push("regular medications");
  if (history.allergies.length === 0) negatives.push("known allergies");
  if (!chronic || chronic.items.length === 0) negatives.push("chronic illnesses");
  if (
    !fh ||
    (fh.gynecologic_cancers.length === 0 && fh.chronic_illnesses.length === 0)
  ) {
    negatives.push("significant family history");
  }
  if (negatives.length > 0) {
    sentences.push(`No ${humanJoin(negatives)}.`);
  }

  return sentences.join(" ");
}

export function buildCompactSummary(
  obs: ObstetricSummary | null,
  signals: ClinicalSignal[],
): string {
  const parts: string[] = [];
  if (obs) parts.push(obstetricLabel(obs));

  const meaningful = signals
    .filter((s) => s.severity !== "positive")
    .slice(0, 3)
    .map((s) => s.label);

  if (meaningful.length === 0) {
    // Fall back to positive signals if nothing meaningful
    const positive = signals
      .filter((s) => s.severity === "positive")
      .slice(0, 2)
      .map((s) => s.label);
    parts.push(...positive);
  } else {
    parts.push(...meaningful);
  }

  return parts.join(" • ");
}
