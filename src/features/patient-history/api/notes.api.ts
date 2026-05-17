import { apiAuthFetch } from "@/infrastructure/http/api";

export type NoteVisibility = "PRIVATE_TO_ORG" | "SHARED_GLOBAL";

export interface NoteDto {
  id: string;
  patient_id: string;
  organization_id: string;
  author_id: string;
  section_code: string;
  content: string;
  visibility: NoteVisibility;
  created_at: string;
  updated_at: string;
}

export interface RedactedNoteCountDto {
  organization_id: string;
  organization_name: string;
  section_code: string;
  count: number;
}

export interface NotesListDto {
  visible: NoteDto[];
  redacted_by_org: RedactedNoteCountDto[];
}

export function listSectionNotes(patientId: string, sectionCode: string) {
  const q = new URLSearchParams({ section_code: sectionCode }).toString();
  return apiAuthFetch<{ data: NotesListDto }>(
    `/patients/${patientId}/history/notes?${q}`,
  );
}

export function createSectionNote(
  patientId: string,
  body: { section_code: string; content: string; visibility?: NoteVisibility },
) {
  return apiAuthFetch<{ data: NoteDto }>(
    `/patients/${patientId}/history/notes`,
    { method: "POST", body: JSON.stringify(body) },
  );
}

export function updateSectionNote(
  noteId: string,
  body: { content?: string; visibility?: NoteVisibility },
) {
  return apiAuthFetch<{ data: NoteDto }>(`/patient-history-notes/${noteId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteSectionNote(noteId: string) {
  return apiAuthFetch<void>(`/patient-history-notes/${noteId}`, {
    method: "DELETE",
  });
}