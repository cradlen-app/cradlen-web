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
    // Not every error's `details` is a field map — PATIENT_HAS_OPEN_VISIT
    // carries `{ visitId }` and JOURNEY_ALLOWANCE_EXCEEDED carries counters.
    details?: Record<string, unknown> & { fields?: Record<string, string[]> };
  };
};

/**
 * Outcome of mapping a failed visit submit. The caller (a component) owns
 * i18n + presentation, so we return *what* to show, not the rendered string:
 *  - `fields`     → set inline field errors.
 *  - `toastKey`   → toast a known translated message (`create.<key>`).
 *  - `toastMessage` → toast a server-provided message verbatim.
 *  - `allowanceExceeded` → the org is out of billable journey units; the
 *    caller decides whether to offer a subscription CTA (owners only).
 */
export type VisitSubmitError =
  | { kind: "fields"; fieldErrors: Record<string, string> }
  | {
      kind: "toastKey";
      key: "errorPatientHasOpenVisit" | "errorGeneric";
      /** The blocking visit, when the API told us which one it is. */
      visitId?: string;
    }
  | { kind: "toastMessage"; message: string }
  | {
      kind: "allowanceExceeded";
      remaining: number;
      needed: number;
      allowance: number;
      consumed: number;
    };

/**
 * Translates a visit book/update failure into a presentation-ready outcome,
 * replacing the hand-rolled `instanceof ApiError` + nested optional-chaining
 * block that used to live in the submit handler. Reuses the template-aware
 * field mappers so server field paths / `"<code> <message>"` arrays land on the
 * right inputs.
 */
export function mapVisitApiError(
  error: unknown,
  template?: FormTemplateDto,
): VisitSubmitError {
  if (!(error instanceof ApiError)) {
    return { kind: "toastKey", key: "errorGeneric" };
  }

  const apiError = (error.body as ApiErrorBody | undefined)?.error;

  if (apiError?.code === "PATIENT_HAS_OPEN_VISIT") {
    // The API tells us which visit is blocking; pass it up so the caller can
    // offer to open it instead of leaving the user at a dead end.
    const visitId = apiError.details?.visitId;
    return {
      kind: "toastKey",
      key: "errorPatientHasOpenVisit",
      ...(typeof visitId === "string" ? { visitId } : {}),
    };
  }

  // Checked before the `details.fields` branch below: this error's `details` is
  // a counter bag, not a field map, and would otherwise fall into the mapper.
  if (apiError?.code === "JOURNEY_ALLOWANCE_EXCEEDED") {
    const d = apiError.details ?? {};
    const num = (v: unknown) => (typeof v === "number" ? v : 0);
    return {
      kind: "allowanceExceeded",
      remaining: num(d.remaining),
      needed: num(d.needed),
      allowance: num(d.allowance),
      consumed: num(d.consumed),
    };
  }

  const details = apiError?.details?.fields;
  if (details) {
    // Without a template there is nothing to map field paths onto — degrade to
    // a readable toast rather than dropping the server's explanation.
    if (!template) {
      return {
        kind: "toastMessage",
        message: Object.values(details).flat().join(", "),
      };
    }
    return { kind: "fields", fieldErrors: mapServerFieldErrors(template, details) };
  }

  // Template-validation failures arrive as a `message` array of
  // "<fieldCode> <message>" strings (empty `details`). Map them to fields;
  // fall back to a joined toast when none resolve to a known field.
  const message = apiError?.message;
  if (Array.isArray(message)) {
    if (template) {
      const mapped = mapServerMessageErrors(template, message);
      if (Object.keys(mapped).length > 0) {
        return { kind: "fields", fieldErrors: mapped };
      }
    }
    return { kind: "toastMessage", message: message.join(", ") };
  }

  if (message) return { kind: "toastMessage", message };
  return { kind: "toastKey", key: "errorGeneric" };
}
