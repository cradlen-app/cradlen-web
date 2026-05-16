/**
 * Reverse of `buildSubmission` — given a template plus an existing visit (and,
 * for patient visits, the freshly-fetched full Patient with its SPOUSE
 * Guardian), produce the `ExecutionSnapshot` that should hydrate the form when
 * opening the drawer in edit mode.
 *
 * The mapping for create-namespace fields (PATIENT/GUARDIAN/MEDICAL_REP/VISIT/
 * INTAKE) sets `formValues[code]`. Identity host fields (those carrying
 * `searchEntity` config) additionally seed `searchState[code].transientValue`
 * so the rendered input shows the existing name. LOOKUP/SYSTEM/COMPUTED are
 * intentionally not seeded.
 */

import type { ApiPatient } from "@/features/visits/types/visits.api.types";
import type { Visit } from "@/features/visits/types/visits.types";
import type { SearchEntry } from "../runtime/TemplateExecutionContext";
import type { FormFieldDto, FormTemplateDto } from "./template.types";

interface InitialSnapshot {
  formValues: Record<string, unknown>;
  searchState: Record<string, SearchEntry>;
  systemValues: Record<string, unknown>;
}

type SpouseGuardian =
  | {
      id?: string;
      full_name?: string;
      national_id?: string | null;
      phone_number?: string | null;
    }
  | undefined;

export function buildInitialValues(
  template: FormTemplateDto,
  visit: Visit,
  patient?: ApiPatient | null,
  specialtyCode?: string,
): InitialSnapshot {
  const spouse = pickSpouseGuardian(patient);
  const formValues: Record<string, unknown> = {};
  const searchState: Record<string, SearchEntry> = {};
  const systemValues: Record<string, unknown> = {
    visitor_type: visit.kind === "medical_rep" ? "MEDICAL_REP" : "PATIENT",
  };
  // Seed every SYSTEM-bound discriminator the template carries so the
  // first_option default never fires after mount — that would change a watched
  // discriminator and wipe the prefilled formValues via discriminator-reset.
  if (specialtyCode) systemValues.specialty_code = specialtyCode;

  for (const section of template.sections) {
    for (const field of section.fields) {
      const value = readValue(field, visit, patient, spouse);
      if (value === undefined || value === null) continue;
      formValues[field.code] = value;

      // If the field carries searchEntity config, seed it as an already-resolved
      // entity so EntitySearchInput renders the label without firing a search.
      // Also write the paired LOOKUP id so submission carries it.
      const searchEntity = field.config?.ui?.searchEntity as
        | { idTarget?: string; kind?: string }
        | undefined;
      if (searchEntity && typeof value === "string") {
        const resolvedId = resolveEntityId(searchEntity.kind, visit, patient, spouse);
        searchState[field.code] = {
          transientValue: value,
          suggestions: [],
          resolvedEntityId: resolvedId ? { id: resolvedId, label: value } : null,
        };
        if (resolvedId && searchEntity.idTarget) {
          formValues[searchEntity.idTarget] = resolvedId;
        }
      }
    }
  }

  return { formValues, searchState, systemValues };
}

function resolveEntityId(
  kind: string | undefined,
  visit: Visit,
  patient: ApiPatient | null | undefined,
  spouse: SpouseGuardian,
): string | undefined {
  switch (kind) {
    case "patient":
      return patient?.id ?? visit.patient.id ?? undefined;
    case "guardian":
      return spouse?.id ?? undefined;
    case "medical_rep":
      return visit.patient.id ?? undefined;
    default:
      return undefined;
  }
}

function pickSpouseGuardian(patient?: ApiPatient | null): SpouseGuardian {
  const link = patient?.guardian_links?.find(
    (l) => l.relation_to_patient === "SPOUSE",
  );
  if (link?.guardian) {
    return {
      id: link.guardian.id,
      full_name: link.guardian.full_name,
      national_id: link.guardian.national_id,
      phone_number: link.guardian.phone_number,
    };
  }
  return undefined;
}

function readValue(
  field: FormFieldDto,
  visit: Visit,
  patient: ApiPatient | null | undefined,
  spouse: SpouseGuardian,
): unknown {
  const ns = field.binding?.namespace;
  const path = field.binding?.path;
  if (!ns || !path) return undefined;

  switch (ns) {
    case "PATIENT":
      return readPatientPath(path, visit, patient);
    case "GUARDIAN":
      return readGuardianPath(path, visit, spouse);
    case "MEDICAL_REP":
      return readMedRepPath(path, visit);
    case "VISIT":
      return readVisitPath(path, visit);
    case "INTAKE":
      return readIntakePath(path, visit);
    case "LOOKUP":
    case "SYSTEM":
    case "COMPUTED":
    default:
      return undefined;
  }
}

function readPatientPath(
  path: string,
  visit: Visit,
  patient: ApiPatient | null | undefined,
): unknown {
  // Prefer the freshly-fetched full Patient when available; fall back to the
  // visit row's projected fields.
  const p = patient;
  const vp = visit.patient;
  switch (path) {
    case "full_name":
      return p?.full_name ?? vp.fullName;
    case "national_id":
      return p?.national_id ?? vp.nationalId;
    case "date_of_birth": {
      const v = p?.date_of_birth ?? vp.dateOfBirth;
      return v ? String(v).slice(0, 10) : undefined;
    }
    case "phone_number":
      return p?.phone_number ?? vp.phone;
    case "address":
      return p?.address ?? vp.address;
    case "marital_status":
      return p?.marital_status ?? vp.maritalStatus;
    default:
      return undefined;
  }
}

function readGuardianPath(
  path: string,
  visit: Visit,
  spouse: SpouseGuardian,
): unknown {
  switch (path) {
    case "full_name":
      return spouse?.full_name;
    case "national_id":
      return spouse?.national_id ?? undefined;
    case "phone_number":
      return spouse?.phone_number ?? undefined;
    default:
      return undefined;
  }
}

function readMedRepPath(path: string, visit: Visit): unknown {
  const vp = visit.patient;
  switch (path) {
    case "rep_full_name":
    case "full_name":
      return vp.fullName;
    case "rep_national_id":
    case "national_id":
      return vp.nationalId;
    case "rep_phone_number":
    case "phone_number":
      return vp.phone;
    case "email":
      return vp.email;
    case "company_name":
      return vp.companyName;
    default:
      return undefined;
  }
}

function readVisitPath(path: string, visit: Visit): unknown {
  switch (path) {
    case "assigned_doctor_id":
      return visit.assignedDoctorId;
    case "priority":
      return visit.priority;
    case "appointment_type":
      return visit.type;
    case "scheduled_at":
      return visit.scheduledAt
        ? toDatetimeLocal(visit.scheduledAt)
        : undefined;
    case "notes":
      return visit.notes;
    case "care_path_code":
      return visit.carePathCode;
    default:
      return undefined;
  }
}

function readIntakePath(path: string, visit: Visit): unknown {
  if (path === "chief_complaint") return visit.chiefComplaint ?? undefined;
  if (path.startsWith("chief_complaint_meta.")) {
    const leaf = path.slice("chief_complaint_meta.".length);
    return (visit.chiefComplaintMeta as Record<string, unknown> | null | undefined)?.[leaf];
  }
  if (path.startsWith("vitals.")) {
    const leaf = path.slice("vitals.".length);
    return (visit.vitals as Record<string, unknown> | null | undefined)?.[leaf];
  }
  return undefined;
}

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}