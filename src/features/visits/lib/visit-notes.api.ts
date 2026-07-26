import { apiAuthFetch } from "@/infrastructure/http/api";
import type { ApiResponse } from "@/common/types/api.types";
import type {
  ApiPatientVisitNote,
  ApiVisitNote,
  PatientVisitNote,
  VisitNote,
} from "../types/visits-notes.types";

function mapVisitNote(row: ApiVisitNote): VisitNote {
  return {
    id: row.id,
    visitId: row.visit_id,
    content: row.content,
    addedAfterClose: row.added_after_close,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPatientVisitNote(row: ApiPatientVisitNote): PatientVisitNote {
  return {
    ...mapVisitNote(row),
    visitScheduledAt: row.visit_scheduled_at,
    visitStatus: row.visit_status,
  };
}

/** The caller's own notes for one visit, newest first. */
export async function fetchVisitNotes(visitId: string): Promise<VisitNote[]> {
  const res = await apiAuthFetch<ApiResponse<ApiVisitNote[]>>(
    `/visits/${visitId}/notes`,
  );
  return res.data.map(mapVisitNote);
}

export type FetchPatientVisitNotesParams = {
  patientId: string;
  page?: number;
  limit?: number;
};

/**
 * The caller's own notes across every visit of one patient. Rows arrive flat,
 * ordered by visit then time, so the caller can group contiguously.
 */
export async function fetchPatientVisitNotes({
  patientId,
  page,
  limit,
}: FetchPatientVisitNotesParams): Promise<{
  items: PatientVisitNote[];
  total: number;
}> {
  const search = new URLSearchParams();
  if (page) search.set("page", String(page));
  search.set("limit", String(limit ?? 50));

  // ResponseInterceptor flattens a paginated payload to `{ data: items[], meta }`
  // — `data` is the array itself, and `meta` sits at the top level, NOT nested
  // under `data`.
  const res = await apiAuthFetch<ApiResponse<ApiPatientVisitNote[]>>(
    `/patients/${patientId}/visit-notes?${search.toString()}`,
  );
  return {
    items: res.data.map(mapPatientVisitNote),
    total: res.meta?.total ?? res.data.length,
  };
}

export async function createVisitNote(
  visitId: string,
  content: string,
): Promise<VisitNote> {
  const res = await apiAuthFetch<ApiResponse<ApiVisitNote>>(
    `/visits/${visitId}/notes`,
    { method: "POST", body: JSON.stringify({ content }) },
  );
  return mapVisitNote(res.data);
}

export async function updateVisitNote(
  visitId: string,
  noteId: string,
  content: string,
): Promise<VisitNote> {
  const res = await apiAuthFetch<ApiResponse<ApiVisitNote>>(
    `/visits/${visitId}/notes/${noteId}`,
    { method: "PATCH", body: JSON.stringify({ content }) },
  );
  return mapVisitNote(res.data);
}

export async function deleteVisitNote(
  visitId: string,
  noteId: string,
): Promise<void> {
  await apiAuthFetch<void>(`/visits/${visitId}/notes/${noteId}`, {
    method: "DELETE",
  });
}
