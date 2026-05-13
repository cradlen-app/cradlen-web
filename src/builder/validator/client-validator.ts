import { applyEffect, firstMatchingMessage } from "../rules/predicate.evaluator";
import type { ExecutionSnapshot } from "../templates/submission-builder";
import type {
  FormFieldDto,
  FormSectionDto,
  FormTemplateDto,
} from "../templates/template.types";

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function sectionVisible(section: FormSectionDto, ctx: Record<string, unknown>): boolean {
  return applyEffect(section.config?.logic?.predicates, "visible", ctx, true);
}

function fieldVisible(field: FormFieldDto, ctx: Record<string, unknown>): boolean {
  return applyEffect(field.config?.logic?.predicates, "visible", ctx, true);
}

function readFieldValue(field: FormFieldDto, snapshot: ExecutionSnapshot): unknown {
  if (field.binding?.namespace === "LOOKUP") {
    return snapshot.searchState[field.code]?.resolvedEntityId?.id ?? null;
  }
  if (field.binding?.namespace === "SYSTEM") {
    return snapshot.systemValues[field.code];
  }
  return snapshot.formValues[field.code];
}

/**
 * Runs `required` + `forbidden` predicates across the template against the
 * current snapshot. Returns a map of field-code → error message.
 */
export function validateTemplate(
  template: FormTemplateDto,
  snapshot: ExecutionSnapshot,
): Record<string, string> {
  const ctx = { ...snapshot.systemValues, ...snapshot.formValues };
  const errors: Record<string, string> = {};

  for (const section of template.sections) {
    if (!sectionVisible(section, ctx)) continue;

    for (const field of section.fields) {
      if (!fieldVisible(field, ctx)) continue;

      const value = readFieldValue(field, snapshot);
      const requiredByPredicate = applyEffect(
        field.config?.logic?.predicates,
        "required",
        ctx,
        false,
      );
      const required = field.required || requiredByPredicate;

      if (required && isEmpty(value)) {
        const msg =
          firstMatchingMessage(field.config?.logic?.predicates, "required", ctx) ??
          `${field.label} is required`;
        errors[field.code] = msg;
        continue;
      }

      const forbidden = applyEffect(
        field.config?.logic?.predicates,
        "forbidden",
        ctx,
        false,
      );
      if (forbidden && !isEmpty(value)) {
        const msg =
          firstMatchingMessage(field.config?.logic?.predicates, "forbidden", ctx) ??
          `${field.label} is not allowed here`;
        errors[field.code] = msg;
      }
    }
  }

  return errors;
}

/**
 * Maps a server-side `details.fields` map (keyed by binding path or
 * `spouse_<path>` flat name) back to template field codes.
 */
export function mapServerFieldErrors(
  template: FormTemplateDto,
  serverFields: Record<string, string[] | string>,
): Record<string, string> {
  const byPath: Record<string, string> = {};
  for (const section of template.sections) {
    for (const field of section.fields) {
      const ns = field.binding?.namespace;
      const path = field.binding?.path;
      if (!ns || !path) continue;
      const flat = ns === "GUARDIAN" ? `spouse_${path}` : path;
      byPath[flat] = field.code;
    }
  }
  const out: Record<string, string> = {};
  for (const [serverKey, messages] of Object.entries(serverFields)) {
    const code = byPath[serverKey];
    if (!code) continue;
    out[code] = Array.isArray(messages) ? messages[0] : messages;
  }
  return out;
}
