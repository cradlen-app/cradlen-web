import type { SignalSeverity } from "./types";

export const SIGNAL_PRIORITIES: Record<
  string,
  { priority: number; severity: SignalSeverity }
> = {
  // Obstetric — immediate clinical significance
  ectopic: { priority: 95, severity: "high" },
  recurrent_abortion: { priority: 90, severity: "high" },
  stillbirth: { priority: 85, severity: "high" },

  // Allergies
  allergy_severe: { priority: 90, severity: "high" },
  allergy_moderate: { priority: 75, severity: "medium" },
  allergy_mild: { priority: 60, severity: "low" },

  // Chronic illness
  dm: { priority: 88, severity: "high" },
  htn: { priority: 88, severity: "high" },
  epilepsy: { priority: 80, severity: "high" },
  thyroid: { priority: 72, severity: "medium" },
  chronic_default: { priority: 65, severity: "medium" },

  // Family history
  family_gyn_cancer: { priority: 82, severity: "high" },
  family_chronic: { priority: 45, severity: "low" },

  // Gynecologic
  dysmenorrhea: { priority: 55, severity: "medium" },

  // Social
  smoking_current: { priority: 68, severity: "medium" },
  smoking_former: { priority: 40, severity: "low" },

  // Screening
  screening_not_done: { priority: 50, severity: "medium" },

  // Positive / safety flags
  no_allergies: { priority: 20, severity: "positive" },
};

export function normalizeChronic(item: string): string {
  const s = item.toLowerCase();
  if (s.includes("diabet")) return "dm";
  if (s.includes("hypertens") || s === "htn") return "htn";
  if (s.includes("thyroid")) return "thyroid";
  if (s.includes("epilep") || s.includes("seizure")) return "epilepsy";
  return "chronic_default";
}
