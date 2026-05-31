import type { BindingNamespace } from "@/builder/templates/template.types";

/**
 * Embedded patient-history sections in the `obgyn_examination` template carry a
 * `history_` code prefix (mirrors the backend seed). Used to detect which
 * sections are care-path-gated history sections.
 */
export const HISTORY_SECTION_PREFIX = "history_";

/**
 * Namespace → body/envelope container for the OB/GYN examination. History fields
 * (`PATIENT_OBGYN_HISTORY.*`) are nested under `obgyn_history` on the exam PATCH
 * and read from `envelope.obgyn_history` on the GET — keeping them off the
 * composite exam root (where `medications` would collide with the prescription
 * array). Visit-scoped namespaces stay at the root (omitted here).
 */
export const OBGYN_EXAM_CONTAINERS: Partial<Record<BindingNamespace, string>> = {
  PATIENT_OBGYN_HISTORY: "obgyn_history",
};
