import { describe, expect, it } from "vitest";
import type { ApiPatient } from "@/features/visits/types/visits.api.types";
import type { Visit } from "@/features/visits/types/visits.types";
import { buildInitialValues } from "./initial-values-builder";
import type {
  BindingNamespace,
  FormFieldDto,
  FormTemplateDto,
} from "./template.types";

let seq = 0;
function field(
  code: string,
  namespace: BindingNamespace | null,
  path: string | null,
  config: FormFieldDto["config"] = {},
): FormFieldDto {
  seq += 1;
  return {
    id: `f-${seq}`,
    code,
    label: code,
    type: "TEXT",
    order: seq,
    required: false,
    binding: { namespace, path },
    config,
  };
}

function template(fields: FormFieldDto[]): FormTemplateDto {
  return {
    id: "tpl",
    code: "TPL",
    name: "T",
    description: null,
    scope: "BOOK_VISIT",
    version: 1,
    activated_at: null,
    specialty_id: null,
    sections: [{ id: "s", code: "main", name: "Main", order: 0, config: {}, fields }],
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

describe("buildInitialValues — PATIENT phone path", () => {
  it("reads phone_number from the visit projection", () => {
    const snap = buildInitialValues(template([field("ph", "PATIENT", "phone_number")]), makeVisit(), null);
    expect(snap.formValues.ph).toBe("0100000000");
  });

  it("prefers the full patient's phone_number", () => {
    const patient = { phone_number: "0999" } as unknown as ApiPatient;
    const snap = buildInitialValues(template([field("ph", "PATIENT", "phone_number")]), makeVisit(), patient);
    expect(snap.formValues.ph).toBe("0999");
  });
});

describe("buildInitialValues — MEDICAL_REP phone/national aliases", () => {
  it("maps rep_national_id / national_id / rep_phone_number / phone_number", () => {
    const tpl = template([
      field("rni", "MEDICAL_REP", "rep_national_id"),
      field("ni", "MEDICAL_REP", "national_id"),
      field("rph", "MEDICAL_REP", "rep_phone_number"),
      field("ph", "MEDICAL_REP", "phone_number"),
    ]);
    const snap = buildInitialValues(tpl, makeVisit({ kind: "medical_rep" }));
    expect(snap.formValues.rni).toBe("29001011234567");
    expect(snap.formValues.ni).toBe("29001011234567");
    expect(snap.formValues.rph).toBe("0100000000");
    expect(snap.formValues.ph).toBe("0100000000");
  });

  it("ignores an unknown MEDICAL_REP path", () => {
    const snap = buildInitialValues(
      template([field("x", "MEDICAL_REP", "bogus")]),
      makeVisit({ kind: "medical_rep" }),
    );
    expect("x" in snap.formValues).toBe(false);
  });
});

describe("buildInitialValues — medical_rep searchEntity id resolution", () => {
  it("resolves the rep id from the visit patient and seeds the id target", () => {
    const tpl = template([
      field("rep_name", "MEDICAL_REP", "full_name", {
        ui: { searchEntity: { kind: "medical_rep", idTarget: "rep_id" } },
      }),
    ]);
    const snap = buildInitialValues(tpl, makeVisit({ kind: "medical_rep" }));
    expect(snap.searchState.rep_name.resolvedEntityId).toEqual({ id: "pat-1", label: "Jane Doe" });
    expect(snap.formValues.rep_id).toBe("pat-1");
  });
});

describe("buildInitialValues — VISIT/INTAKE unknown paths", () => {
  it("ignores unknown VISIT and INTAKE paths", () => {
    const tpl = template([
      field("uv", "VISIT", "bogus_visit_field"),
      field("ui", "INTAKE", "bogus_intake_field"),
    ]);
    const snap = buildInitialValues(tpl, makeVisit());
    expect("uv" in snap.formValues).toBe(false);
    expect("ui" in snap.formValues).toBe(false);
  });
});

describe("buildInitialValues — scheduled_at invalid date", () => {
  it("yields an empty string when scheduled_at cannot be parsed", () => {
    const tpl = template([field("sched", "VISIT", "scheduled_at")]);
    const snap = buildInitialValues(tpl, makeVisit({ scheduledAt: "garbage" }));
    expect(snap.formValues.sched).toBe("");
  });
});
