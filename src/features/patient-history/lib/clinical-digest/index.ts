import type { ObgynHistorySummary, ObstetricSummary } from "../../api/obgyn-history-summary.api";
import type { ClinicalDigest } from "./types";
import { extractSignals } from "./extractors";
import { obstetricLabel, buildNarrative, buildCompactSummary } from "./formatters";

function ageFromDob(dob?: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.2425));
}

export function buildClinicalDigest(
  history: ObgynHistorySummary,
  patientDateOfBirth?: string | null,
): ClinicalDigest {
  const age = ageFromDob(patientDateOfBirth);
  const obs = history.obstetric_summary as ObstetricSummary | null;

  const headerParts: string[] = [];
  if (age !== null) headerParts.push(`${age}y`);
  if (obs) headerParts.push(obstetricLabel(obs));
  const header = headerParts.join(" • ") || "—";

  const signals = extractSignals(history);
  const flags = signals.slice(0, 6).map(({ label, severity }) => ({ label, severity }));
  const summary = buildNarrative(history);
  const compactSummary = buildCompactSummary(obs, signals);

  return { header, flags, summary, compactSummary };
}

export type { ClinicalDigest, ClinicalFlag, ClinicalSignal, SignalSeverity } from "./types";
