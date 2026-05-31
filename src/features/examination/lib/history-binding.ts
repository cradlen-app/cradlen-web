import type { BindingNamespace } from "@/builder/templates/template.types";

/**
 * Embedded patient-history sections in the `obgyn_examination` template carry a
 * `history_` code prefix (mirrors the backend seed). Used to detect which
 * sections are care-path-gated history sections.
 */
export const HISTORY_SECTION_PREFIX = "history_";

/**
 * Namespace → body/envelope container for the OB/GYN examination.
 *
 * - History fields (`PATIENT_OBGYN_HISTORY.*`) nest under `obgyn_history` on the
 *   exam PATCH and read from `envelope.obgyn_history` on the GET — keeping them
 *   off the composite exam root (where `medications` would collide with the
 *   prescription array).
 * - Vitals (`VISIT_VITALS.*`) nest under `vitals` to match `VitalsDto` on the
 *   API (the DTO accepts vitals as a nested object, and the GET envelope returns
 *   them under `vitals`). Their template binding paths are flat (`systolic_bp`),
 *   so without this container they'd land at the body root and be rejected by
 *   `forbidNonWhitelisted` (and never pre-fill on GET).
 *
 * Other visit-scoped namespaces stay at the root (omitted here): encounter
 * scalars + findings nest correctly by path, and repeatable diagnoses/
 * investigations/medications resolve to root-level array keys.
 */
export const OBGYN_EXAM_CONTAINERS: Partial<Record<BindingNamespace, string>> = {
  PATIENT_OBGYN_HISTORY: "obgyn_history",
  VISIT_VITALS: "vitals",
};
