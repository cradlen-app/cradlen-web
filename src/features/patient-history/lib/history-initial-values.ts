/**
 * Re-export shim. The actual implementation moved to
 * `@/builder/templates/initial-values`. The previous export name
 * `toInitialHistoryState` is kept here as an alias so existing
 * patient-history call sites stay green; new features should import
 * `toInitialFormState` from the new home.
 */
import type { PatientHistoryEnvelope } from "../api/patient-history.api";
import type { FormTemplateDto } from "@/builder/templates/template.types";
import {
  toInitialFormState,
  type InitialFormState,
} from "@/builder/templates/initial-values";

export type InitialHistoryState = InitialFormState;

export function toInitialHistoryState(
  envelope: PatientHistoryEnvelope,
  template: FormTemplateDto,
): InitialFormState {
  return toInitialFormState(envelope, template);
}
