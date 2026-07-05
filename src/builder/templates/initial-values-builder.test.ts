import { describe, expect, it } from "vitest";
import type { ApiPatient } from "@/features/visits/types/visits.api.types";
import type { Visit } from "@/features/visits/types/visits.types";
import { buildInitialValues } from "./initial-values-builder";
import type {
  FormFieldDto,
  FormTemplateDto,
  BindingNamespace,
} from "./template.types";

let fieldId = 0;

function field(
  code: string,
  namespace: BindingNamespace | null,
  path: string | null,
  config: FormFieldDto["config"] = {},
): FormFieldDto {
  fieldId += 1;
  return {
    id: `f-${fieldId}`,
    code,
    label: code,
    type: "TEXT",
    order: fieldId,
    required: false,
    binding: { namespace, path },
    config,
  };
}

function template(fields: FormFieldDto[]): FormTemplateDto {
  return {
    id: "tpl-1",
    code: "TPL",
    name: "Template",
    description: null,
    scope: "BOOK_VISIT",
    version: 1,
    activated_at: null,
    specialty_id: null,
    sections: [
      {
        id: "s-1",
        code: "main",
        name: "Main",
        order: 1,
        config: {},
        fields,
      },
    ],
  };
}

function makeVisit(overrides: Partial<Visit> = {}): Visit {
  return {
    id: "v-1",
    kind: "patient",
    branchId: "b-1",
    patient: {
      id: "pat-1",
      firstName: "Jane",
      lastName: "Doe",
      fullName: "Jane Doe",
      nationalId: "29001011234567",
      dateOfBirth: "1990-01-01T00:00:00.000Z",
      phone: "0100000000",
      address: "12 Nile St",
      maritalStatus: "MARRIED",
      email: "rep@acme.com",
      companyName: "Acme Pharma",
      specialtyFocus: "OBGYN",
    },
    type: "VISIT",
    status: "CHECKED_IN",
    priority: "NORMAL",
    assignedDoctorId: "doc-1",
    carePathCode: "ANC",
    notes: "bring labs",
    scheduledAt: "2024-03-10T14:30:00",
    chiefComplaint: "headache",
    chiefComplaintMeta: { duration: "2d" } as Visit["chiefComplaintMeta"],
    vitals: { weight: 70 } as Visit["vitals"],
    createdAt: "2024-03-01T00:00:00Z",
    ...overrides,
  };
}

const fullPatient = {
  id: "full-pat-1",
  full_name: "Janet Fuller",
  national_id: "11111111111111",
  date_of_birth: "1985-05-05T00:00:00.000Z",
  phone_number: "0111111111",
  address: "99 Cairo Rd",
  marital_status: "SINGLE",
} as unknown as ApiPatient;

describe("buildInitialValues — systemValues", () => {
  it("sets visitor_type PATIENT for a patient visit", () => {
    const snap = buildInitialValues(template([]), makeVisit());
    expect(snap.systemValues.visitor_type).toBe("PATIENT");
  });

  it("sets visitor_type MEDICAL_REP for a medical_rep visit", () => {
    const snap = buildInitialValues(
      template([]),
      makeVisit({ kind: "medical_rep" }),
    );
    expect(snap.systemValues.visitor_type).toBe("MEDICAL_REP");
  });

  it("seeds specialty_code only when provided", () => {
    expect(
      buildInitialValues(template([]), makeVisit()).systemValues.specialty_code,
    ).toBeUndefined();
    expect(
      buildInitialValues(template([]), makeVisit(), null, "OBGYN").systemValues
        .specialty_code,
    ).toBe("OBGYN");
  });
});

describe("buildInitialValues — PATIENT bindings", () => {
  it("prefers the freshly-fetched patient over the visit projection", () => {
    const tpl = template([
      field("full_name", "PATIENT", "full_name"),
      field("national_id", "PATIENT", "national_id"),
      field("address", "PATIENT", "address"),
    ]);
    const snap = buildInitialValues(tpl, makeVisit(), fullPatient);
    expect(snap.formValues.full_name).toBe("Janet Fuller");
    expect(snap.formValues.national_id).toBe("11111111111111");
    expect(snap.formValues.address).toBe("99 Cairo Rd");
  });

  it("falls back to the visit projection when no full patient", () => {
    const tpl = template([
      field("full_name", "PATIENT", "full_name"),
      field("marital_status", "PATIENT", "marital_status"),
    ]);
    const snap = buildInitialValues(tpl, makeVisit(), null);
    expect(snap.formValues.full_name).toBe("Jane Doe");
    expect(snap.formValues.marital_status).toBe("MARRIED");
  });

  it("truncates date_of_birth to the YYYY-MM-DD date part", () => {
    const tpl = template([field("dob", "PATIENT", "date_of_birth")]);
    const snap = buildInitialValues(tpl, makeVisit(), fullPatient);
    expect(snap.formValues.dob).toBe("1985-05-05");
  });

  it("omits a field whose value resolves to undefined", () => {
    const tpl = template([field("dob", "PATIENT", "date_of_birth")]);
    const visit = makeVisit({
      patient: { ...makeVisit().patient, dateOfBirth: undefined },
    });
    const snap = buildInitialValues(tpl, visit, null);
    expect("dob" in snap.formValues).toBe(false);
  });

  it("ignores an unknown PATIENT path", () => {
    const tpl = template([field("x", "PATIENT", "bogus")]);
    const snap = buildInitialValues(tpl, makeVisit(), fullPatient);
    expect("x" in snap.formValues).toBe(false);
  });
});

describe("buildInitialValues — MEDICAL_REP bindings", () => {
  it("maps rep aliases and direct names from the visit patient", () => {
    const tpl = template([
      field("rep_name", "MEDICAL_REP", "rep_full_name"),
      field("name2", "MEDICAL_REP", "full_name"),
      field("email", "MEDICAL_REP", "email"),
      field("company", "MEDICAL_REP", "company_name"),
      field("specialty", "MEDICAL_REP", "specialty_focus"),
    ]);
    const snap = buildInitialValues(
      tpl,
      makeVisit({ kind: "medical_rep" }),
    );
    expect(snap.formValues.rep_name).toBe("Jane Doe");
    expect(snap.formValues.name2).toBe("Jane Doe");
    expect(snap.formValues.email).toBe("rep@acme.com");
    expect(snap.formValues.company).toBe("Acme Pharma");
    expect(snap.formValues.specialty).toBe("OBGYN");
  });
});

describe("buildInitialValues — VISIT bindings", () => {
  it("maps doctor, priority, appointment type, notes, care path", () => {
    const tpl = template([
      field("doc", "VISIT", "assigned_doctor_id"),
      field("prio", "VISIT", "priority"),
      field("appt", "VISIT", "appointment_type"),
      field("notes", "VISIT", "notes"),
      field("cp", "VISIT", "care_path_code"),
    ]);
    const snap = buildInitialValues(tpl, makeVisit());
    expect(snap.formValues.doc).toBe("doc-1");
    expect(snap.formValues.prio).toBe("NORMAL");
    expect(snap.formValues.appt).toBe("VISIT");
    expect(snap.formValues.notes).toBe("bring labs");
    expect(snap.formValues.cp).toBe("ANC");
  });

  it("converts scheduled_at to a datetime-local string", () => {
    const tpl = template([field("sched", "VISIT", "scheduled_at")]);
    const snap = buildInitialValues(tpl, makeVisit());
    // Local-time input (no Z) round-trips deterministically.
    expect(snap.formValues.sched).toBe("2024-03-10T14:30");
  });

  it("omits scheduled_at when the visit has none", () => {
    const tpl = template([field("sched", "VISIT", "scheduled_at")]);
    const snap = buildInitialValues(
      tpl,
      makeVisit({ scheduledAt: undefined }),
    );
    expect("sched" in snap.formValues).toBe(false);
  });
});

describe("buildInitialValues — INTAKE bindings", () => {
  it("reads chief complaint and nested meta/vitals leaves", () => {
    const tpl = template([
      field("cc", "INTAKE", "chief_complaint"),
      field("dur", "INTAKE", "chief_complaint_meta.duration"),
      field("wt", "INTAKE", "vitals.weight"),
    ]);
    const snap = buildInitialValues(tpl, makeVisit());
    expect(snap.formValues.cc).toBe("headache");
    expect(snap.formValues.dur).toBe("2d");
    expect(snap.formValues.wt).toBe(70);
  });

  it("skips nested leaves when the container is null", () => {
    const tpl = template([
      field("dur", "INTAKE", "chief_complaint_meta.duration"),
      field("wt", "INTAKE", "vitals.weight"),
    ]);
    const snap = buildInitialValues(
      tpl,
      makeVisit({ chiefComplaintMeta: null, vitals: null }),
    );
    expect("dur" in snap.formValues).toBe(false);
    expect("wt" in snap.formValues).toBe(false);
  });
});

describe("buildInitialValues — fields without a binding", () => {
  it("skips fields missing namespace or path", () => {
    const tpl = template([
      field("noNs", null, "full_name"),
      field("noPath", "PATIENT", null),
    ]);
    const snap = buildInitialValues(tpl, makeVisit(), fullPatient);
    expect(snap.formValues).toEqual({});
  });
});

describe("buildInitialValues — searchEntity seeding", () => {
  it("seeds searchState and the paired id target for a patient picker", () => {
    const tpl = template([
      field("patient_name", "PATIENT", "full_name", {
        ui: {
          searchEntity: { kind: "patient", idTarget: "patient_id" },
        },
      }),
    ]);
    const snap = buildInitialValues(tpl, makeVisit(), fullPatient);

    expect(snap.searchState.patient_name).toEqual({
      transientValue: "Janet Fuller",
      suggestions: [],
      resolvedEntityId: { id: "full-pat-1", label: "Janet Fuller" },
    });
    // idTarget mirrors the resolved id into formValues.
    expect(snap.formValues.patient_id).toBe("full-pat-1");
  });

  it("resolves a patient id from the visit when no full patient is present", () => {
    const tpl = template([
      field("patient_name", "PATIENT", "full_name", {
        ui: { searchEntity: { kind: "patient", idTarget: "patient_id" } },
      }),
    ]);
    const snap = buildInitialValues(tpl, makeVisit(), null);
    expect(snap.formValues.patient_id).toBe("pat-1");
    expect(snap.searchState.patient_name.resolvedEntityId).toEqual({
      id: "pat-1",
      label: "Jane Doe",
    });
  });

  it("leaves resolvedEntityId null when the kind cannot resolve an id", () => {
    const tpl = template([
      field("doctor_name", "VISIT", "assigned_doctor_id", {
        ui: { searchEntity: { kind: "doctor", idTarget: "doctor_id" } },
      }),
    ]);
    const snap = buildInitialValues(tpl, makeVisit());
    expect(snap.searchState.doctor_name.resolvedEntityId).toBeNull();
    // No id target written when nothing resolved.
    expect("doctor_id" in snap.formValues).toBe(false);
  });

  it("does not write the id target when idTarget is absent", () => {
    const tpl = template([
      // Deliberately omit the (type-required) idTarget to exercise the
      // "no id target written" branch; cast past the missing property.
      field("patient_name", "PATIENT", "full_name", {
        ui: { searchEntity: { kind: "patient" } },
      } as FormFieldDto["config"]),
    ]);
    const snap = buildInitialValues(tpl, makeVisit(), fullPatient);
    expect(snap.searchState.patient_name.resolvedEntityId).toEqual({
      id: "full-pat-1",
      label: "Janet Fuller",
    });
    expect(snap.formValues).not.toHaveProperty("patient_id");
  });
});
