/**
 * Mirror of cradlen-api FormTemplateDto/FormSectionDto/FormFieldDto.
 * Plain string-literal unions — no @prisma/client dep on the FE.
 */

import type { Predicate } from "../rules/predicates.types";

export type BindingNamespace =
  | "PATIENT"
  | "VISIT"
  | "INTAKE"
  | "GUARDIAN"
  | "MEDICAL_REP"
  | "LOOKUP"
  | "SYSTEM"
  | "COMPUTED"
  | "PATIENT_OBGYN_HISTORY"
  | "VISIT_ENCOUNTER"
  | "VISIT_VITALS"
  | "VISIT_OBGYN_ENCOUNTER"
  | "VISIT_INVESTIGATION"
  | "PRESCRIPTION_ITEM";

export type FormFieldType =
  | "TEXT"
  | "TEXTAREA"
  | "NUMBER"
  | "DECIMAL"
  | "DATE"
  | "DATETIME"
  | "BOOLEAN"
  | "SELECT"
  | "MULTISELECT"
  | "ENTITY_SEARCH"
  | "COMPUTED";

export type FormScope = "BOOK_VISIT" | "ENCOUNTER" | "PATIENT_HISTORY";

export type FieldOption = { code: string; label: string };

export interface FieldConfig {
  ui?: {
    placeholder?: string;
    /** 1..12 column span inside the section's 12-col grid. */
    colSpan?: number;
    /** Input-variant hint. e.g. MULTISELECT can render as 'checkboxes' instead of pill toggles. */
    variant?: string;
    derivedFrom?: string[];
    /**
     * URL template (optionally with `/v1` prefix) to fetch SELECT options from.
     * May contain `{org_id}` / `{branch_id}` placeholders, which are substituted
     * from the active auth context at fetch time.
     */
    optionsSource?: string;
    /**
     * Initial value applied once when the field is empty.
     * - Literal (`string` / `number` / `boolean`): applied on mount.
     * - `{ kind: "first_option" }`: applied once the options resolve.
     */
    default?:
      | string
      | number
      | boolean
      | { kind: "first_option" }
      | { kind: "now" };
    /**
     * Marks a (visible) field as an entity-search autocomplete. The resolved id
     * lands in the field named by `idTarget`; sibling fields listed in
     * `fillFields` are populated from the picked raw payload. When
     * `allowCreate` is true, the typed text is preserved at the host field's
     * own binding so the backend can take the "new entity" branch.
     */
    searchEntity?: {
      kind: string;
      idTarget: string;
      fillFields?: Record<string, string>;
      allowCreate?: boolean;
      /**
       * Resolves a sibling ENTITY_SEARCH field from the picked raw payload.
       * Keyed by the target search field's `code`. Used e.g. to pre-resolve
       * the spouse guardian when a patient is selected.
       */
      fillEntitySearches?: Record<
        string,
        {
          idSource: string;
          labelSource: string;
          fillFields?: Record<string, string>;
        }
      >;
    };
    [key: string]: unknown;
  };
  validation?: {
    options?: FieldOption[];
    min?: number;
    max?: number;
    maxLength?: number;
    [key: string]: unknown;
  };
  logic?: {
    predicates?: Predicate[];
    entity?: string;
    is_discriminator?: boolean;
    formula?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface SectionConfig {
  ui?: {
    /** Top-level group title for nesting sections under one heading. */
    group?: string;
    [key: string]: unknown;
  };
  validation?: Record<string, unknown>;
  logic?: { predicates?: Predicate[] };
  [key: string]: unknown;
}

export interface FormFieldDto {
  id: string;
  code: string;
  label: string;
  type: FormFieldType;
  order: number;
  required: boolean;
  binding: { namespace: BindingNamespace | null; path: string | null };
  config: FieldConfig;
}

export interface FormSectionDto {
  id: string;
  code: string;
  name: string;
  order: number;
  is_repeatable?: boolean;
  config: SectionConfig;
  fields: FormFieldDto[];
}

export interface FormTemplateDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  scope: FormScope;
  version: number;
  activated_at: string | Date | null;
  specialty_id: string | null;
  sections: FormSectionDto[];
}

export interface FormTemplateResponse {
  data: FormTemplateDto;
}
