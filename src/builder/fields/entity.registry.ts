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
  }));
}

async function searchPatientsByQuery(query: string): Promise<EntityResult[]> {
  const res = await searchPatients(query);
  return res.data.map(mapApiPatientToPatient).map((p) => ({
    id: p.id,
    label: p.fullName,
    subtitle: [p.nationalId, p.phoneNumber].filter(Boolean).join(" · "),
  }));
}

export const ENTITY_REGISTRY: Record<string, EntitySearchFn> = {
  patient: searchPatientsByQuery,
  medical_rep: searchMedicalReps,
};

export function getEntitySearchFn(kind: string): EntitySearchFn | undefined {
  return ENTITY_REGISTRY[kind];
}
