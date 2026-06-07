/**
 * Frontend-side mirror of cradlen-api ENTITIES. Each registered entity kind
 * resolves to a search function the EntitySearchInput calls. Adding a new
 * `ENTITY_SEARCH` kind = one entry here + the same kind on the API.
 */

import { apiAuthFetch } from "@/infrastructure/http/api";
import { searchPatients } from "@/features/visits/lib/visits.api";
import { mapApiPatientToPatient } from "@/features/visits/lib/visits.utils";

export interface EntityResult {
  id: string;
  label: string;
  subtitle?: string;
  /** Original payload row, used by `ui.searchEntity.fillFields` to copy props onto sibling fields. */
  raw?: unknown;
}

export type EntitySearchFn = (query: string) => Promise<EntityResult[]>;

interface MedicalRepListItem {
  id: string;
  full_name: string;
  company_name?: string;
  national_id?: string;
}

async function searchMedicalReps(query: string): Promise<EntityResult[]> {
  const params = new URLSearchParams({ search: query, limit: "20" });
  const res = await apiAuthFetch<{ data: MedicalRepListItem[] }>(
    `/medical-reps?${params.toString()}`,
  );
  return res.data.map((r) => ({
    id: r.id,
    label: r.full_name,
    subtitle: [r.company_name, r.national_id].filter(Boolean).join(" · "),
    raw: r,
  }));
}

async function searchPatientsByQuery(query: string): Promise<EntityResult[]> {
  const res = await searchPatients(query);
  return res.data.map((row) => {
    const mapped = mapApiPatientToPatient(row);
    return {
      id: mapped.id,
      label: mapped.fullName,
      subtitle: [mapped.nationalId, mapped.phoneNumber].filter(Boolean).join(" · "),
      raw: row,
    };
  });
}

interface MedicationListItem {
  id: string;
  code: string;
  name: string;
  generic_name?: string | null;
  form?: string | null;
  strength?: string | null;
  default_dose_amount?: number | null;
  default_dose_unit?: string | null;
  default_dose_frequency?: string | null;
  notes?: string | null;
}

async function searchMedicationsByQuery(query: string): Promise<EntityResult[]> {
  const params = new URLSearchParams({ search: query, limit: "20" });
  const res = await apiAuthFetch<{ data: MedicationListItem[] }>(
    `/medications?${params.toString()}`,
  );
  return res.data.map((m) => {
    // Readable default dose for the line's "Dose / frequency" field (filled
    // on pick via the drug_search field's `fillFields`).
    const defaultDose = [
      m.default_dose_amount != null
        ? `${m.default_dose_amount}${m.default_dose_unit ?? ""}`
        : null,
      m.default_dose_frequency,
    ]
      .filter(Boolean)
      .join(" / ");
    return {
      id: m.id,
      label: m.name,
      subtitle: [m.strength, m.form, m.generic_name].filter(Boolean).join(" · "),
      raw: { ...m, default_dose: defaultDose },
    };
  });
}

interface DiagnosisCodeListItem {
  id: string;
  code: string;
  description: string;
  chapter?: string | null;
  specialty_code?: string | null;
  billable?: boolean;
}

async function searchDiagnosesByQuery(query: string): Promise<EntityResult[]> {
  const params = new URLSearchParams({ search: query });
  const res = await apiAuthFetch<{ data: DiagnosisCodeListItem[] }>(
    `/diagnosis-codes?${params.toString()}`,
  );
  // `id = code`: the resolved value mirrors the ICD-10 code into the paired
  // `diagnosis_code` field (via `fillFields`); codes are unique → safe key.
  return res.data.map((d) => ({
    id: d.code,
    label: d.description,
    subtitle: [d.code, d.chapter].filter(Boolean).join(" · "),
    raw: d,
  }));
}

interface LabTestListItem {
  id: string;
  code: string;
  name: string;
  category?: string | null;
}

async function searchLabTestsByQuery(query: string): Promise<EntityResult[]> {
  const params = new URLSearchParams({ search: query });
  const res = await apiAuthFetch<{ data: LabTestListItem[] }>(
    `/lab-tests?${params.toString()}`,
  );
  // `category` is mirrored into the line's Type dropdown via `fillFields`.
  return res.data.map((t) => ({
    id: t.id,
    label: t.name,
    subtitle: [t.code, t.category].filter(Boolean).join(" · "),
    raw: t,
  }));
}

export const ENTITY_REGISTRY: Record<string, EntitySearchFn> = {
  patient: searchPatientsByQuery,
  medical_rep: searchMedicalReps,
  medication: searchMedicationsByQuery,
  diagnosis: searchDiagnosesByQuery,
  lab_test: searchLabTestsByQuery,
};

export function getEntitySearchFn(kind: string): EntitySearchFn | undefined {
  return ENTITY_REGISTRY[kind];
}
