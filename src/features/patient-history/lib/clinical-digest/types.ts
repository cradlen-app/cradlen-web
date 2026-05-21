export type SignalSeverity = "high" | "medium" | "low" | "positive";

export interface ClinicalSignal {
  key: string;
  label: string;
  severity: SignalSeverity;
  priority: number;
  source:
    | "obstetric"
    | "gynecologic"
    | "allergy"
    | "medication"
    | "chronic"
    | "family"
    | "social"
    | "screening";
}

export interface ClinicalFlag {
  label: string;
  severity: SignalSeverity;
}

export interface ClinicalDigest {
  header: string;
  flags: ClinicalFlag[];
  summary: string;
  compactSummary: string;
}
