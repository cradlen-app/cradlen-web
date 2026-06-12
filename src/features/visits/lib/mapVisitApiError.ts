import { ApiError } from "@/infrastructure/http/api";
import {
  mapServerFieldErrors,
  mapServerMessageErrors,
} from "@/builder/validator/client-validator";
import type { FormTemplateDto } from "@/builder/templates/template.types";

/** The API's GlobalExceptionFilter envelope (subset the submit flow reads). */
type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string | string[];
    details?: { fields?: Record<string, string[]> };
  };
};

/**
 * Outcome of mapping a failed visit submit. The caller (a component) owns
 * i18n + presentation, so we return *what* to show, not the rendered string:
 *  - `fields`     → set inline field errors.
 *  - `toastKey`   → toast a known translated message (`create.<key>`).
 *  - `toastMessage` → toast a server-provided message verbatim.
 */
export type VisitSubmitError =
  | { kind: "fields"; fieldErrors: Record<string, string> }
  | { kind: "toastKey"; key: "errorPatientHasOpenVisit" | "errorGeneric" }
  | { kind: "toastMessage"; message: string };

/**
 * Translates a visit book/update failure into a presentation-ready outcome,
 * replacing the hand-rolled `instanceof ApiError` + nested optional-chaining
 * block that used to live in the submit handler. Reuses the template-aware
 * field mappers so server field paths / `"<code> <message>"` arrays land on the
 * right inputs.
 */
export function mapVisitApiError(
  error: unknown,
  template: FormTemplateDto,
): VisitSubmitError {
  if (!(error instanceof ApiError)) {
    return { kind: "toastKey", key: "errorGeneric" };
  }

  const apiError = (error.body as ApiErrorBody | undefined)?.error;

  if (apiError?.code === "PATIENT_HAS_OPEN_VISIT") {
    return { kind: "toastKey", key: "errorPatientHasOpenVisit" };
  }

  const details = apiError?.details?.fields;
  if (details) {
    return { kind: "fields", fieldErrors: mapServerFieldErrors(template, details) };
  }

  // Template-validation failures arrive as a `message` array of
  // "<fieldCode> <message>" strings (empty `details`). Map them to fields;
  // fall back to a joined toast when none resolve to a known field.
  const message = apiError?.message;
  if (Array.isArray(message)) {
    const mapped = mapServerMessageErrors(template, message);
    if (Object.keys(mapped).length > 0) {
      return { kind: "fields", fieldErrors: mapped };
    }
    return { kind: "toastMessage", message: message.join(", ") };
  }

  if (message) return { kind: "toastMessage", message };
  return { kind: "toastKey", key: "errorGeneric" };
}
