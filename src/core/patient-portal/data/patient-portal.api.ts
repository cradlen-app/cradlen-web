/**
 * Patient portal data access — the single swap point for the real backend.
 *
 * Today every function resolves from in-memory fixtures behind a short delay.
 * When patient-scoped endpoints exist, replace each body with an
 * `apiAuthFetch("/...")` call; the return types and all callers stay identical.
 *
 * Uploads mutate a module-local clone of the fixtures so the prototype reflects
 * new documents and flips the related lab order to "pending_review".
 */
import type {
  Appointment,
  HealthRecord,
  LabOrder,
  PatientProfile,
  PortalDocument,
  PortalMedication,
  Reminder,
  UploadDocumentInput,
} from "../types/patient-portal.types";
import {
  APPOINTMENTS,
  CLINICS,
  DOCUMENTS,
  HEALTH_RECORDS,
  LAB_ORDERS,
  MEDICATIONS,
  PROFILES,
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

export function fetchProfiles(): Promise<PatientProfile[]> {
  return delay(clone(PROFILES));
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

export function fetchMedications(patientId: string): Promise<PortalMedication[]> {
  return delay(clone(MEDICATIONS[patientId] ?? []));
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
