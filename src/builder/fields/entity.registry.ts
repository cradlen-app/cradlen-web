/**
 * Frontend-side mirror of cradlen-api ENTITIES. Each registered entity kind
 * resolves to a search function the EntitySearchInput calls. Adding a new
 * `ENTITY_SEARCH` kind = one entry here + the same kind on the API.
 */

import { apiAuthFetch } from "@/infrastructure/http/api";
import { searchPatients } from "@/features/visits/lib/visits.api";
import { searchGuardians } from "@/features/patients/lib/guardians.api";
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

async function searchGuardiansByQuery(query: string): Promise<EntityResult[]> {
  const res = await searchGuardians(query);
  return res.data.map((g) => ({
    id: g.id,
    label: g.full_name,
    subtitle: [g.national_id, g.phone_number].filter(Boolean).join(" · "),
    raw: g,
  }));
}

interface MedicationListItem {
  id: string;
  code: string;
  name: string;
  generic_name?: string | null;
  form?: string | null;
  strength?: string | null;
}

async function searchMedicationsByQuery(query: string): Promise<EntityResult[]> {
  const params = new URLSearchParams({ search: query, limit: "20" });
  const res = await apiAuthFetch<{ data: MedicationListItem[] }>(
    `/medications?${params.toString()}`,
  );
  return res.data.map((m) => ({
    id: m.id,
    label: m.name,
    subtitle: [m.strength, m.form, m.generic_name].filter(Boolean).join(" · "),
    raw: m,
  }));
}

export const ENTITY_REGISTRY: Record<string, EntitySearchFn> = {
  patient: searchPatientsByQuery,
  medical_rep: searchMedicalReps,
  guardian: searchGuardiansByQuery,
  medication: searchMedicationsByQuery,
};

export function getEntitySearchFn(kind: string): EntitySearchFn | undefined {
  return ENTITY_REGISTRY[kind];
}
