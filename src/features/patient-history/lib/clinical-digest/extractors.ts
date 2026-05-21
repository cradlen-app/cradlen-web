import type {
  ObgynHistorySummary,
  ObstetricSummary,
  ChronicIllnesses,
  FamilyHistory,
  ScreeningHistory,
} from "../../api/obgyn-history-summary.api";
import type { ClinicalSignal } from "./types";
import { SIGNAL_PRIORITIES, normalizeChronic } from "./clinical-priority";

export function extractSignals(history: ObgynHistorySummary): ClinicalSignal[] {
  const signals: ClinicalSignal[] = [];

  // Obstetric signals
  const obs = history.obstetric_summary as ObstetricSummary | null;
  if (obs) {
    const ectopic = obs.ectopic ?? 0;
    const stillbirths = obs.stillbirths ?? 0;
    const abortion = obs.abortion ?? 0;
    if (ectopic > 0) {
      signals.push({
        key: "ectopic",
        label: `Ectopic Hx (×${ectopic})`,
        ...SIGNAL_PRIORITIES.ectopic,
        source: "obstetric",
      });
    }
    if (stillbirths > 0) {
      signals.push({
        key: "stillbirth",
        label: `Stillbirth (×${stillbirths})`,
        ...SIGNAL_PRIORITIES.stillbirth,
        source: "obstetric",
      });
    }
    if (abortion >= 2) {
      signals.push({
        key: "recurrent_abortion",
        label: `Recurrent Abortion (×${abortion})`,
        ...SIGNAL_PRIORITIES.recurrent_abortion,
        source: "obstetric",
      });
    }
  }

  // Allergies
  for (const a of history.allergies) {
    const sev = a.severity?.toUpperCase();
    const key =
      sev === "SEVERE"
        ? "allergy_severe"
        : sev === "MODERATE"
          ? "allergy_moderate"
          : "allergy_mild";
    const label =
      a.allergy_to + (a.severity ? ` (${a.severity.toLowerCase()})` : "");
    signals.push({
      key,
      label,
      ...SIGNAL_PRIORITIES[key],
      source: "allergy",
    });
  }

  // No known allergies — positive flag (only when no allergies at all)
  if (history.allergies.length === 0) {
    signals.push({
      key: "no_allergies",
      label: "No Known Allergies",
      ...SIGNAL_PRIORITIES.no_allergies,
      source: "allergy",
    });
  }

  // Chronic illnesses
  const chronic = history.medical_chronic_illnesses as ChronicIllnesses | null;
  if (chronic) {
    for (const item of chronic.items) {
      const normalKey = normalizeChronic(item);
      const meta =
        SIGNAL_PRIORITIES[normalKey] ?? SIGNAL_PRIORITIES.chronic_default;
      signals.push({ key: normalKey, label: item, ...meta, source: "chronic" });
    }
  }

  // Family gynecologic cancer history
  const fh = history.family_history as FamilyHistory | null;
  if (fh && fh.gynecologic_cancers.length > 0) {
    signals.push({
      key: "family_gyn_cancer",
      label: "GYN Cancer FH",
      ...SIGNAL_PRIORITIES.family_gyn_cancer,
      source: "family",
    });
  }

  // Gynecological baseline — dysmenorrhea
  const gyn = history.gynecological_baseline as
    | { dysmenorrhea: boolean }
    | null;
  if (gyn?.dysmenorrhea) {
    signals.push({
      key: "dysmenorrhea",
      label: "Dysmenorrhea",
      ...SIGNAL_PRIORITIES.dysmenorrhea,
      source: "gynecologic",
    });
  }

  // Social — smoking
  const social = history.social_history as { smoking: string } | null;
  if (social) {
    const s = social.smoking.toUpperCase();
    const isNever = ["NEVER", "NON_SMOKER", "NEVER_SMOKER", "NO"].some((v) =>
      s.includes(v),
    );
    const isCurrent = !isNever && (s.includes("CURRENT") || s === "YES");
    const isFormer =
      !isNever && !isCurrent && (s.includes("FORMER") || s.includes("EX"));
    if (isCurrent) {
      signals.push({
        key: "smoking_current",
        label: "Current Smoker",
        ...SIGNAL_PRIORITIES.smoking_current,
        source: "social",
      });
    } else if (isFormer) {
      signals.push({
        key: "smoking_former",
        label: "Former Smoker",
        ...SIGNAL_PRIORITIES.smoking_former,
        source: "social",
      });
    }
  }

  // Screening — pap not done
  const screen = history.screening_history as ScreeningHistory | null;
  if (screen && !screen.pap_smear) {
    signals.push({
      key: "screening_not_done",
      label: "Pap Not Done",
      ...SIGNAL_PRIORITIES.screening_not_done,
      source: "screening",
    });
  }

  // Sort descending by priority, deduplicate by key
  const seen = new Set<string>();
  return signals
    .sort((a, b) => b.priority - a.priority)
    .filter((s) => {
      if (seen.has(s.key)) return false;
      seen.add(s.key);
      return true;
    });
}
