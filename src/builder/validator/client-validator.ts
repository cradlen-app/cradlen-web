import { applyEffect, firstMatchingMessage } from "../rules/predicate.evaluator";
import type { ExecutionSnapshot } from "../templates/submission-builder";
import type {
  FormFieldDto,
  FormSectionDto,
  FormTemplateDto,
} from "../templates/template.types";

/**
 * Translator for validation messages — shaped like next-intl's `t`. When the
 * caller doesn't supply one, an English fallback is used (keeps the messages
 * stable for tests and non-localized contexts).
 */
export type ValidationTranslate = (
  key: string,
  params?: Record<string, string | number>,
) => string;

const FALLBACK_MESSAGES: Record<
  string,
  (p: Record<string, string | number>) => string
> = {
  required: (p) => `${p.label} is required`,
  forbidden: (p) => `${p.label} is not allowed here`,
  minLength: (p) => `${p.label} must be at least ${p.min} characters`,
  maxLength: (p) => `${p.label} must be at most ${p.max} characters`,
  invalidFormat: (p) => `${p.label} has an invalid format`,
  invalidDate: (p) => `${p.label} is not a valid date`,
  futureDate: (p) => `${p.label} must not be in the future`,
  maxAge: (p) =>
    `${p.label} exceeds the maximum allowed age of ${p.maxAge} years`,
  min: (p) => `${p.label} must be at least ${p.min}`,
  max: (p) => `${p.label} must be at most ${p.max}`,
};

function resolveTranslate(translate?: ValidationTranslate): ValidationTranslate {
  return (key, params = {}) =>
    translate ? translate(key, params) : (FALLBACK_MESSAGES[key]?.(params) ?? key);
}

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
  translate?: ValidationTranslate,
): Record<string, string> {
  const t = resolveTranslate(translate);
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
          t("required", { label: field.label });
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
          t("forbidden", { label: field.label });
        errors[field.code] = msg;
        continue;
      }

      // Value constraints from `config.validation` — mirrors the backend
      // TemplateValidator.enforceValueConstraints. Only runs when a value is
      // present and no required/forbidden error already fired.
      if (!isEmpty(value)) {
        const constraintError = checkValueConstraints(field, value, t);
        if (constraintError) errors[field.code] = constraintError;
      }
    }
  }

  return errors;
}

/**
 * Enforces a field's `config.validation` constraints against a present value,
 * mirroring the backend. Returns the first failure message, or null. Strings
 * check minLength/maxLength/pattern; DATE/DATETIME check notInFuture/maxAgeYears;
 * numerics check min/max.
 */
function checkValueConstraints(
  field: FormFieldDto,
  value: unknown,
  t: ValidationTranslate,
): string | null {
  const v = field.config?.validation;
  if (!v) return null;
  const label = field.label;

  if (typeof value === "string") {
    if (typeof v.minLength === "number" && value.length < v.minLength) {
      return t("minLength", { label, min: v.minLength });
    }
    if (typeof v.maxLength === "number" && value.length > v.maxLength) {
      return t("maxLength", { label, max: v.maxLength });
    }
    if (typeof v.pattern === "string") {
      let re: RegExp | null = null;
      try {
        re = new RegExp(v.pattern);
      } catch {
        re = null;
      }
      if (re && !re.test(value)) return t("invalidFormat", { label });
    }
  }

  if (
    (field.type === "DATE" || field.type === "DATETIME") &&
    (v.notInFuture === true || typeof v.maxAgeYears === "number")
  ) {
    const date = new Date(value as string);
    if (Number.isNaN(date.getTime())) return t("invalidDate", { label });
    const now = new Date();
    if (v.notInFuture === true && date.getTime() > now.getTime()) {
      return t("futureDate", { label });
    }
    if (typeof v.maxAgeYears === "number") {
      const earliest = new Date(now);
      earliest.setFullYear(earliest.getFullYear() - v.maxAgeYears);
      if (date.getTime() < earliest.getTime()) {
        return t("maxAge", { label, maxAge: v.maxAgeYears });
      }
    }
  }

  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))
        ? Number(value)
        : null;
  if (numeric !== null && Number.isFinite(numeric)) {
    if (typeof v.min === "number" && numeric < v.min) {
      return t("min", { label, min: v.min });
    }
    if (typeof v.max === "number" && numeric > v.max) {
      return t("max", { label, max: v.max });
    }
  }

  return null;
}

/**
 * Maps a server-side `details.fields` map (keyed by binding path) back to
 * template field codes.
 */
export function mapServerFieldErrors(
  template: FormTemplateDto,
  serverFields: Record<string, string[] | string>,
): Record<string, string> {
  const byPath: Record<string, string> = {};
  for (const section of template.sections) {
    for (const field of section.fields) {
      const path = field.binding?.path;
      if (!path) continue;
      byPath[path] = field.code;
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

/**
 * Maps the backend template-validation error array — each entry is
 * `"<fieldCode> <message>"` (e.g. `"national_id has an invalid format"`) — back
 * to a field-code → message map. The leading token is the field code, matching
 * the FE field codes directly (no binding-path translation needed). Unknown
 * codes are ignored.
 */
export function mapServerMessageErrors(
  template: FormTemplateDto,
  messages: string[],
): Record<string, string> {
  const codes = new Set<string>();
  for (const section of template.sections) {
    for (const field of section.fields) codes.add(field.code);
  }
  const out: Record<string, string> = {};
  for (const entry of messages) {
    if (typeof entry !== "string") continue;
    const spaceIdx = entry.indexOf(" ");
    if (spaceIdx <= 0) continue;
    const code = entry.slice(0, spaceIdx);
    const message = entry.slice(spaceIdx + 1);
    if (codes.has(code) && !(code in out)) out[code] = message;
  }
  return out;
}
