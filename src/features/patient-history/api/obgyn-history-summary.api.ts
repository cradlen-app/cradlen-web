import { apiAuthFetch } from "@/infrastructure/http/api";

export interface ObstetricSummary {
  gravida: number;
  para: number;
  abortion: number;
  ectopic: number;
  stillbirths: number;
}

export interface GynecologicalBaseline {
  age_at_menarche: number;
  cycle_regularity: string;
  dysmenorrhea: boolean;
}

export interface ChronicIllnesses {
  items: string[];
  notes: string;
}

export interface FamilyHistory {
  gynecologic_cancers: string[];
  chronic_illnesses: string[];
}

export interface SocialHistory {
  smoking: string;
  alcohol: string;
}

export interface ScreeningHistory {
  pap_smear: string | null;
  pap_smear_date: string | null;
  mammography: string | null;
  mammography_date: string | null;
}

export interface AllergySnapshot {
  allergy_to: string;
  severity: string | null;
  associated_symptoms: string | null;
}

export interface MedicationSnapshot {
  drug_name: string;
  dose: string | null;
  frequency: string | null;
}

export interface ObgynHistorySummary {
  history_exists: boolean;
  allergies: AllergySnapshot[];
  current_medications: MedicationSnapshot[];
  obstetric_summary: ObstetricSummary | null;
  gynecological_baseline: GynecologicalBaseline | null;
  medical_chronic_illnesses: ChronicIllnesses | null;
  family_history: FamilyHistory | null;
  social_history: SocialHistory | null;
  screening_history: ScreeningHistory | null;
  section_timestamps: Record<string, string> | null;
}

export function fetchObgynHistorySummary(
  patientId: string,
): Promise<{ data: ObgynHistorySummary }> {
  return apiAuthFetch<{ data: ObgynHistorySummary }>(
    `/patients/${patientId}/obgyn-history-summary`,
  );
}
