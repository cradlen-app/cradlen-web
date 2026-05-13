/**
 * Mirror of cradlen-api FIELD_TYPES — namespace allowlist per FormFieldType.
 * Used by the renderer to pick an input and (optionally) by tests to assert
 * that a template's bindings respect the contract.
 */

import type { BindingNamespace, FormFieldType } from "../templates/template.types";

const ALL_NS: ReadonlyArray<BindingNamespace> = [
  "PATIENT",
  "VISIT",
  "INTAKE",
  "GUARDIAN",
  "MEDICAL_REP",
  "LOOKUP",
  "SYSTEM",
  "COMPUTED",
];

export const FIELD_TYPE_ALLOWED_NAMESPACES: Record<
  FormFieldType,
  ReadonlySet<BindingNamespace>
> = {
  TEXT: new Set(ALL_NS),
  TEXTAREA: new Set(ALL_NS),
  NUMBER: new Set(ALL_NS),
  DECIMAL: new Set(ALL_NS),
  DATE: new Set(ALL_NS),
  DATETIME: new Set(ALL_NS),
  BOOLEAN: new Set(ALL_NS),
  SELECT: new Set(ALL_NS),
  MULTISELECT: new Set(ALL_NS),
  ENTITY_SEARCH: new Set<BindingNamespace>(["LOOKUP", "VISIT", "MEDICAL_REP"]),
  COMPUTED: new Set<BindingNamespace>(["COMPUTED"]),
};
