import { applyEffect } from "../rules/predicate.evaluator";
import type {
  BindingNamespace,
  FormFieldDto,
  FormSectionDto,
  FormTemplateDto,
} from "./template.types";

export interface ExecutionSnapshot {
  formValues: Record<string, unknown>;
  searchState: Record<
    string,
    {
      transientValue?: string;
      suggestions?: unknown[];
      resolvedEntityId: { id: string; label: string } | null;
    }
  >;
  systemValues: Record<string, unknown>;
}

/**
 * Mutates `target` so that `path` (dotted) resolves to `value`. Intermediate
 * objects are created on demand. Used for nested INTAKE bindings like
 * `vitals.systolic_bp` or `chief_complaint_meta.categories`.
 */
function setByPath(target: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split(".");
  let cursor: Record<string, unknown> = target;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (typeof cursor[key] !== "object" || cursor[key] === null) {
      cursor[key] = {};
    }
    cursor = cursor[key] as Record<string, unknown>;
  }
  cursor[keys[keys.length - 1]] = value;
}

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function evaluationContext(snapshot: ExecutionSnapshot): Record<string, unknown> {
  return { ...snapshot.systemValues, ...snapshot.formValues };
}

function isSectionVisible(section: FormSectionDto, ctx: Record<string, unknown>): boolean {
  const preds = section.config?.logic?.predicates;
  return applyEffect(preds, "visible", ctx, true);
}

function isFieldVisible(field: FormFieldDto, ctx: Record<string, unknown>): boolean {
  const preds = field.config?.logic?.predicates;
  return applyEffect(preds, "visible", ctx, true);
}

interface PlaceArgs {
  body: Record<string, unknown>;
  namespace: BindingNamespace;
  path: string;
  value: unknown;
}

function placeValue({ body, namespace, path, value }: PlaceArgs): void {
  switch (namespace) {
    case "GUARDIAN": {
      // Spouse fields submit as flat `spouse_<path>` (e.g. `spouse_full_name`).
      const flat = `spouse_${path}`;
      body[flat] = value;
      return;
    }
    case "PATIENT":
    case "VISIT":
    case "INTAKE":
    case "MEDICAL_REP": {
      setByPath(body, path, value);
      return;
    }
    case "LOOKUP": {
      // Resolved id placement is handled at call site (only when an id exists).
      body[path] = value;
      return;
    }
    case "SYSTEM":
    case "COMPUTED":
      return;
  }
}

/**
 * Walks the template once with the given execution snapshot and assembles
 * the request body honoring the binding contract.
 *
 * - Section + field `visible` predicates are evaluated; hidden values are skipped.
 * - LOOKUP submits the resolved entity id (or nothing).
 * - GUARDIAN flattens to `spouse_<path>`.
 * - SYSTEM and COMPUTED are never submitted.
 * - Empty values are skipped (`undefined`, `null`, empty string, empty array).
 */
export function buildSubmission(
  template: FormTemplateDto,
  snapshot: ExecutionSnapshot,
): Record<string, unknown> {
  const ctx = evaluationContext(snapshot);
  const body: Record<string, unknown> = {};

  // When an entity-search field has a resolved LOOKUP id (e.g. an existing
  // medical rep was picked), the identity fields it auto-filled must NOT be
  // submitted alongside the id — the API rejects mixed payloads on the
  // medical-rep route. Build a set of suppressed field codes.
  const suppressedByResolvedLookup = new Set<string>();
  for (const section of template.sections) {
    for (const field of section.fields) {
      const search = field.config?.ui?.searchEntity as
        | {
            idTarget?: string;
            fillFields?: Record<string, string>;
          }
        | undefined;
      if (!search?.idTarget) continue;
      const resolved =
        snapshot.searchState[field.code]?.resolvedEntityId ??
        snapshot.searchState[search.idTarget]?.resolvedEntityId;
      if (!resolved?.id) continue;
      // The search-host field carries the human-readable name and gets
      // submitted via its MEDICAL_REP / PATIENT binding — suppress it.
      suppressedByResolvedLookup.add(field.code);
      if (search.fillFields) {
        for (const localCode of Object.keys(search.fillFields)) {
          suppressedByResolvedLookup.add(localCode);
        }
      }
    }
  }

  for (const section of template.sections) {
    if (!isSectionVisible(section, ctx)) continue;

    for (const field of section.fields) {
      if (!isFieldVisible(field, ctx)) continue;

      const ns = field.binding?.namespace;
      const path = field.binding?.path;
      if (!ns || !path) continue;

      if (ns === "SYSTEM" || ns === "COMPUTED") continue;

      if (ns === "LOOKUP") {
        // Resolved id may come from this field's own searchState (when it's
        // an ENTITY_SEARCH rendered directly) or from formValues (when this
        // field is a hidden idTarget written by another field's ENTITY_SEARCH).
        const resolvedFromSearch =
          snapshot.searchState[field.code]?.resolvedEntityId?.id;
        const resolvedFromForm = snapshot.formValues[field.code];
        const id =
          resolvedFromSearch ??
          (typeof resolvedFromForm === "string" && resolvedFromForm.length > 0
            ? resolvedFromForm
            : undefined);
        if (id) {
          placeValue({ body, namespace: ns, path, value: id });
        }
        continue;
      }

      if (suppressedByResolvedLookup.has(field.code)) continue;

      const value = snapshot.formValues[field.code];
      if (isEmpty(value)) continue;
      placeValue({ body, namespace: ns, path, value });
    }
  }

  return body;
}

/**
 * Picks the submission endpoint based on the SYSTEM discriminator.
 * Falls back to PATIENT route when no discriminator is present.
 */
export function pickSubmissionEndpoint(systemValues: Record<string, unknown>): string {
  return systemValues.visitor_type === "MEDICAL_REP"
    ? "/medical-rep-visits/book"
    : "/visits/book";
}
