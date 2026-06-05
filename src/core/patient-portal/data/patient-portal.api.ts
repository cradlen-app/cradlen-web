/**
 * Patient portal data access — the single swap point for the real backend.
 *
 * `fetchMedications` is wired to the live patient-scoped endpoint
 * (`/api/patient-portal/medications`). The remaining functions still resolve
 * from in-memory fixtures until their backends exist; replace each body with a
 * patient-scoped fetch the same way when they do — the return types and all
 * callers stay identical.
 *
 * Uploads mutate a module-local clone of the fixtures so the prototype reflects
 * new documents and flips the related lab order to "pending_review".
 */
import { apiFetch } from "@/infrastructure/http/api";
import { mapApiMedication } from "../lib/map-medication";
import type { ApiPatientMedicationsResponse } from "./patient-medications.api.types";
import type {
  Appointment,
  HealthRecord,
  LabOrder,
  PatientProfile,
  PortalDocument,
  PortalMedication,
  PortalVisit,
  Reminder,
  UploadDocumentInput,
} from "../types/patient-portal.types";
import {
  APPOINTMENTS,
  CLINICS,
  DOCUMENTS,
  HEALTH_RECORDS,
  LAB_ORDERS,
  REMINDERS,
} from "./fixtures";

/**
 * Resolves on the microtask queue (no artificial latency). Real network delay
 * arrives for free when these bodies are swapped for `apiAuthFetch` calls.
 * Avoiding `setTimeout` also keeps behavior deterministic under hidden tabs,
 * which throttle timers.
 */
function delay<T>(value: T): Promise<T> {
  return Promise.resolve(value);
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

/** Mutable in-memory state, seeded from fixtures, so uploads persist per session. */
const documentsState: Record<string, PortalDocument[]> = clone(DOCUMENTS);
const labOrdersState: Record<string, LabOrder[]> = clone(LAB_ORDERS);

/** Minimal shape of the `/api/patient-auth/me` payload this module consumes. */
type PatientMeResponse = {
  data: {
    accessible_patients: {
      id: string;
      full_name: string;
      date_of_birth: string;
      relation: string; // "SELF" or a GuardianRelation value
    }[];
  };
};

/**
 * The profile list is the real signed-in account: the patient themselves, or
 * the patients a guardian may act on — straight from `/patient-auth/me`, with no
 * mock fixtures or fallback. Demographic fields the backend doesn't yet return
 * (avatar, blood type, height, national id) are simply absent; consumers render
 * a placeholder. Errors surface to the query (the navbar's `usePatientMe`
 * governs the sign-in redirect).
 */
export async function fetchProfiles(): Promise<PatientProfile[]> {
  const me = await apiFetch<PatientMeResponse>("/api/patient-auth/me");
  return me.data.accessible_patients.map((real) => {
    const isSelf = real.relation === "SELF";
    return {
      id: real.id,
      kind: isSelf ? "self" : "dependent",
      fullName: real.full_name,
      dateOfBirth: real.date_of_birth,
      relation: isSelf ? undefined : real.relation,
    };
  });
}

export function fetchHealthRecord(patientId: string): Promise<HealthRecord> {
  const record = HEALTH_RECORDS[patientId] ?? {
    patientId,
    visits: [],
    vitals: [],
    allergies: [],
  };
  return delay(clone(record));
}

/** One page of visit history. Shape mirrors staff `ApiVisitHistoryResponse`. */
export type VisitHistoryPage = {
  data: PortalVisit[];
  meta: { page: number; limit: number; total: number };
};

/**
 * Paginated visit history for a patient, newest first. Slices the in-memory
 * fixtures today; swapping to a real patient-scoped endpoint later keeps this
 * return type and all callers identical.
 */
export function fetchVisitHistory({
  patientId,
  page = 1,
  limit = 10,
}: {
  patientId: string;
  page?: number;
  limit?: number;
}): Promise<VisitHistoryPage> {
  const all = HEALTH_RECORDS[patientId]?.visits ?? [];
  const start = (page - 1) * limit;
  return delay(
    clone({
      data: all.slice(start, start + limit),
      meta: { page, limit, total: all.length },
    }),
  );
}

export async function fetchMedications(
  patientId: string,
): Promise<PortalMedication[]> {
  const qs = patientId ? `?patient_id=${encodeURIComponent(patientId)}` : "";
  const res = await apiFetch<ApiPatientMedicationsResponse>(
    `/api/patient-portal/medications${qs}`,
  );
  return [
    ...res.data.current.map((m) => mapApiMedication(m, "active")),
    ...res.data.past.map((m) => mapApiMedication(m, "past")),
  ];
}

export function fetchLabOrders(patientId: string): Promise<LabOrder[]> {
  return delay(clone(labOrdersState[patientId] ?? []));
}

export function fetchDocuments(patientId: string): Promise<PortalDocument[]> {
  return delay(clone(documentsState[patientId] ?? []));
}

export function fetchAppointments(patientId: string): Promise<Appointment[]> {
  return delay(clone(APPOINTMENTS[patientId] ?? []));
}

export function fetchReminders(patientId: string): Promise<Reminder[]> {
  return delay(clone(REMINDERS[patientId] ?? []));
}

export function uploadDocument(
  input: UploadDocumentInput,
): Promise<PortalDocument> {
  const clinic =
    Object.values(CLINICS).find((c) => c.id === input.clinicId) ??
    CLINICS.maadi;

  const order = input.labOrderId
    ? (labOrdersState[input.forPatientId] ?? []).find(
        (o) => o.id === input.labOrderId,
      )
    : undefined;

  const doc: PortalDocument = {
    id: `doc-${Date.now()}`,
    title: order?.name ?? titleForKind(input.kind),
    kind: input.kind,
    files: input.files,
    clinic,
    doctorName: input.doctorName,
    forPatientId: input.forPatientId,
    visitId: input.visitId ?? order?.visitId,
    labOrderId: input.labOrderId,
    uploadedAt: new Date().toISOString().slice(0, 10),
    status: "pending_review",
    note: input.note,
  };

  documentsState[input.forPatientId] = [
    doc,
    ...(documentsState[input.forPatientId] ?? []),
  ];

  if (order) {
    order.status = "pending_review";
  }

  return delay(clone(doc));
}

function titleForKind(kind: UploadDocumentInput["kind"]): string {
  switch (kind) {
    case "lab_result":
      return "Lab result";
    case "scan":
      return "Scan";
    default:
      return "Document";
  }
}
