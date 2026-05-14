import { describe, expect, it } from "vitest";
import {
  buildSubmission,
  pickSubmissionEndpoint,
  type ExecutionSnapshot,
} from "./submission-builder";
import type { FormTemplateDto } from "./template.types";

function makeTemplate(): FormTemplateDto {
  return {
    id: "tpl",
    code: "book_visit",
    name: "OB book visit",
    description: null,
    scope: "BOOK_VISIT",
    version: 1,
    activated_at: null,
    specialty_id: null,
    sections: [
      {
        id: "s1",
        code: "search",
        name: "Search",
        order: 0,
        config: {},
        fields: [
          {
            id: "f-patient-search",
            code: "patient_search",
            label: "Find patient",
            type: "ENTITY_SEARCH",
            order: 0,
            required: false,
            binding: { namespace: "LOOKUP", path: "patient_id" },
            config: { logic: { entity: "patient" } },
          },
        ],
      },
      {
        id: "s2",
        code: "patient_info",
        name: "Patient info",
        order: 1,
        config: {
          logic: {
            predicates: [
              { effect: "visible", when: { eq: { visitor_type: "PATIENT" } } },
            ],
          },
        },
        fields: [
          {
            id: "f-full-name",
            code: "full_name",
            label: "Full name",
            type: "TEXT",
            order: 0,
            required: false,
            binding: { namespace: "PATIENT", path: "full_name" },
            config: {},
          },
          {
            id: "f-spouse-full-name",
            code: "spouse_full_name",
            label: "Spouse full name",
            type: "TEXT",
            order: 1,
            required: false,
            binding: { namespace: "GUARDIAN", path: "full_name" },
            config: {},
          },
        ],
      },
      {
        id: "s3",
        code: "vitals",
        name: "Vitals",
        order: 2,
        config: {
          logic: {
            predicates: [
              { effect: "visible", when: { eq: { visitor_type: "PATIENT" } } },
            ],
          },
        },
        fields: [
          {
            id: "f-systolic",
            code: "systolic_bp",
            label: "Systolic BP",
            type: "NUMBER",
            order: 0,
            required: false,
            binding: { namespace: "INTAKE", path: "vitals.systolic_bp" },
            config: {},
          },
          {
            id: "f-bmi",
            code: "bmi",
            label: "BMI",
            type: "COMPUTED",
            order: 1,
            required: false,
            binding: { namespace: "COMPUTED", path: "vitals.bmi" },
            config: {},
          },
        ],
      },
      {
        id: "s4",
        code: "visit_metadata",
        name: "Visit metadata",
        order: 3,
        config: {},
        fields: [
          {
            id: "f-visitor-type",
            code: "visitor_type",
            label: "Visitor type",
            type: "SELECT",
            order: 0,
            required: true,
            binding: { namespace: "SYSTEM", path: "visitor_type" },
            config: { logic: { is_discriminator: true } },
          },
          {
            id: "f-specialty-code",
            code: "specialty_code",
            label: "Specialty",
            type: "SELECT",
            order: 1,
            required: true,
            binding: { namespace: "SYSTEM", path: "specialty_code" },
            config: { logic: { is_discriminator: true } },
          },
          {
            id: "f-system-noise",
            code: "ui_only_toggle",
            label: "UI toggle",
            type: "SELECT",
            order: 2,
            required: false,
            binding: { namespace: "SYSTEM", path: "ui_only_toggle" },
            config: {},
          },
        ],
      },
    ],
  };
}

describe("buildSubmission", () => {
  it("places PATIENT/INTAKE/GUARDIAN bindings + SYSTEM discriminators; skips non-discriminator SYSTEM + COMPUTED", () => {
    const snapshot: ExecutionSnapshot = {
      systemValues: {
        visitor_type: "PATIENT",
        specialty_code: "OBGYN",
        ui_only_toggle: "ON",
      },
      formValues: {
        full_name: "Aisha",
        spouse_full_name: "Omar",
        systolic_bp: 120,
        bmi: 22.5,
      },
      searchState: {},
    };
    const body = buildSubmission(makeTemplate(), snapshot);
    expect(body).toEqual({
      full_name: "Aisha",
      spouse_full_name: "Omar",
      vitals: { systolic_bp: 120 },
      visitor_type: "PATIENT",
      specialty_code: "OBGYN",
    });
    expect(body).not.toHaveProperty("ui_only_toggle");
    expect(body.vitals as Record<string, unknown>).not.toHaveProperty("bmi");
  });

  it("omits SYSTEM discriminators whose systemValues are empty", () => {
    const snapshot: ExecutionSnapshot = {
      systemValues: { visitor_type: "PATIENT", specialty_code: "" },
      formValues: {},
      searchState: {},
    };
    const body = buildSubmission(makeTemplate(), snapshot);
    expect(body.visitor_type).toBe("PATIENT");
    expect(body).not.toHaveProperty("specialty_code");
  });

  it("submits resolved LOOKUP id", () => {
    const snapshot: ExecutionSnapshot = {
      systemValues: { visitor_type: "PATIENT" },
      formValues: {},
      searchState: {
        patient_search: { resolvedEntityId: { id: "p-1", label: "Aisha" } },
      },
    };
    const body = buildSubmission(makeTemplate(), snapshot);
    expect(body.patient_id).toBe("p-1");
  });

  it("suppresses entity-search host + fillFields when its LOOKUP id is resolved", () => {
    // Mirrors the medical-rep flow: picking an existing rep auto-fills
    // identity fields, but the API rejects mixed payloads. Only the id ships.
    const template: FormTemplateDto = {
      id: "tpl",
      code: "book_visit",
      name: "Book visit",
      description: null,
      scope: "BOOK_VISIT",
      version: 1,
      activated_at: null,
      specialty_id: null,
      sections: [
        {
          id: "s",
          code: "medical_rep_info",
          name: "Medical rep",
          order: 0,
          config: {},
          fields: [
            {
              id: "f-id",
              code: "medical_rep_id",
              label: "Medical rep id",
              type: "ENTITY_SEARCH",
              order: 0,
              required: false,
              binding: { namespace: "LOOKUP", path: "medical_rep_id" },
              config: {},
            },
            {
              id: "f-name",
              code: "rep_full_name",
              label: "Full name",
              type: "TEXT",
              order: 1,
              required: false,
              binding: { namespace: "MEDICAL_REP", path: "full_name" },
              config: {
                ui: {
                  searchEntity: {
                    kind: "medical_rep",
                    idTarget: "medical_rep_id",
                    fillFields: { rep_national_id: "national_id" },
                  },
                },
              },
            },
            {
              id: "f-natid",
              code: "rep_national_id",
              label: "National ID",
              type: "TEXT",
              order: 2,
              required: false,
              binding: { namespace: "MEDICAL_REP", path: "national_id" },
              config: {},
            },
          ],
        },
      ],
    };
    const snapshot: ExecutionSnapshot = {
      systemValues: { visitor_type: "MEDICAL_REP" },
      formValues: {
        // EntitySearchInput mirrors the picked id into the idTarget formValue.
        medical_rep_id: "rep-1",
        rep_full_name: "Rep One",
        rep_national_id: "123",
      },
      searchState: {
        rep_full_name: { resolvedEntityId: { id: "rep-1", label: "Rep One" } },
      },
    };
    const body = buildSubmission(template, snapshot);
    expect(body.medical_rep_id).toBe("rep-1");
    expect(body).not.toHaveProperty("full_name");
    expect(body).not.toHaveProperty("national_id");
  });

  it("skips fields inside a hidden section", () => {
    const snapshot: ExecutionSnapshot = {
      systemValues: { visitor_type: "MEDICAL_REP" },
      formValues: { full_name: "Aisha", systolic_bp: 120 },
      searchState: {},
    };
    const body = buildSubmission(makeTemplate(), snapshot);
    expect(body).not.toHaveProperty("full_name");
    expect(body).not.toHaveProperty("vitals");
  });
});

describe("pickSubmissionEndpoint", () => {
  it("routes by visitor_type", () => {
    expect(pickSubmissionEndpoint({ visitor_type: "PATIENT" })).toBe("/visits/book");
    expect(pickSubmissionEndpoint({ visitor_type: "MEDICAL_REP" })).toBe(
      "/medical-rep-visits/book",
    );
    expect(pickSubmissionEndpoint({})).toBe("/visits/book");
  });
});
