/** Max characters per note. Mirrors `VISIT_NOTE_MAX_LENGTH` on the API. */
export const VISIT_NOTE_MAX_LENGTH = 2000;

/** One author-private note attached to a visit. */
export type VisitNote = {
  id: string;
  visitId: string;
  content: string;
  /** Written after the visit was closed — badged in the UI. */
  addedAfterClose: boolean;
  createdAt: string;
  updatedAt: string;
};

/** A note in the patient-level list, carrying the visit it belongs to. */
export type PatientVisitNote = VisitNote & {
  visitScheduledAt: string;
  visitStatus: string;
};

/** Wire shapes — snake_case, as returned by the API. */
export type ApiVisitNote = {
  id: string;
  visit_id: string;
  content: string;
  added_after_close: boolean;
  created_at: string;
  updated_at: string;
};

export type ApiPatientVisitNote = ApiVisitNote & {
  visit_scheduled_at: string;
  visit_status: string;
};
