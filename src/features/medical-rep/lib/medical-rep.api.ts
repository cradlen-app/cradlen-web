import { apiAuthFetch } from "@/infrastructure/http/api";
import type {
  MedicalRepDetail,
  MedicalRepListResponse,
  MedicalRepMedicationLink,
  MedicalRepVisitHistoryResponse,
} from "../types/medical-rep.types";
import type { MedicalRepListParams } from "./medical-rep.queryKeys";
import type { ApiMedicalRepVisitListResponse } from "@/features/visits/types/visits.api.types";

export function fetchMedicalReps({ page, limit, search }: MedicalRepListParams) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search.trim()) params.set("search", search.trim());
  return apiAuthFetch<MedicalRepListResponse>(`/medical-reps?${params}`);
}

/** A single rep record — backs the standalone rep overview page header/card. */
export function fetchMedicalRep(repId: string) {
  return apiAuthFetch<{ data: MedicalRepDetail }>(`/medical-reps/${repId}`);
}

/** The rep's linked product medications — backs the overview card's promoted list. */
export function fetchMedicalRepMedications(repId: string) {
  return apiAuthFetch<{ data: MedicalRepMedicationLink[] }>(
    `/medical-reps/${repId}/medications`,
  );
}

/** A single rep's visits, most recent first — backs the drawer "Visits" list. */
export function fetchMedicalRepVisits(repId: string, limit = 20) {
  const params = new URLSearchParams({
    medical_rep_id: repId,
    limit: String(limit),
  });
  return apiAuthFetch<ApiMedicalRepVisitListResponse>(
    `/medical-rep-visits?${params}`,
  );
}

/** Past COMPLETED visits for the rep of `visitId` — backs the Overview timeline. */
export function fetchMedicalRepVisitHistory({
  visitId,
  page,
  limit,
}: {
  visitId: string;
  page: number;
  limit: number;
}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  return apiAuthFetch<MedicalRepVisitHistoryResponse>(
    `/medical-rep-visits/${visitId}/history?${params}`,
  );
}

/** All COMPLETED visits for a rep — backs the standalone rep overview timeline. */
export function fetchMedicalRepVisitHistoryByRep({
  repId,
  page,
  limit,
}: {
  repId: string;
  page: number;
  limit: number;
}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  return apiAuthFetch<MedicalRepVisitHistoryResponse>(
    `/medical-reps/${repId}/visit-history?${params}`,
  );
}
