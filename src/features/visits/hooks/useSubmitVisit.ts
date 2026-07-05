"use client";

import type { ExecutionSnapshot } from "@/builder/templates/submission-builder";
import type { FormTemplateDto } from "@/builder/templates/template.types";
import { ApiError } from "@/infrastructure/http/api";
import {
  fetchPatientById,
  type UpdatePatientRequest,
} from "@/features/patients/lib/patients.api";
import { useUpdatePatient } from "@/features/patients/hooks/useUpdatePatient";
import { buildVisitPayload } from "../lib/visit-submission";
import { useBookVisit } from "./useBookVisit";
import { useBookMedicalRepVisit } from "./useBookMedicalRepVisit";
import { useUpdateVisit, type UpdateVisitRequest } from "./useUpdateVisit";
import { useUpdateMedRepVisit } from "./useUpdateMedRepVisit";
import type {
  ApiPatient,
  BookMedicalRepVisitRequest,
  BookVisitRequest,
  UpdateMedicalRepVisitRequest,
} from "../types/visits.api.types";
import type { Visit } from "../types/visits.types";

/**
 * Editable patient demographics that are written back to the shared patient
 * record on submit. `national_id` is intentionally absent — it's immutable and
 * stays read-only in the booking form.
 */
const EDITABLE_DEMOGRAPHIC_CODES = [
  "full_name",
  "phone_number",
  "address",
  "marital_status",
  "date_of_birth",
] as const;

function normalizeDemographic(code: string, value: unknown): string | undefined {
  if (value == null) return undefined;
  const s = String(value).trim();
  if (s === "") return undefined;
  // DATE values may arrive as a full ISO string on one side — compare on the
  // calendar date only.
  return code === "date_of_birth" ? s.slice(0, 10) : s;
}

/**
 * Builds the patch of demographics the user actually changed versus the
 * canonical patient record. Only non-empty, changed fields are included so an
 * unchanged booking never issues a write.
 */
export function buildPatientPatch(
  current: ApiPatient,
  formValues: Record<string, unknown>,
): UpdatePatientRequest {
  const patch: Record<string, unknown> = {};
  const record = current as unknown as Record<string, unknown>;
  for (const code of EDITABLE_DEMOGRAPHIC_CODES) {
    const next = normalizeDemographic(code, formValues[code]);
    if (next === undefined) continue; // blank form value never clears the record
    const prev = normalizeDemographic(code, record[code]);
    if (next !== prev) patch[code] = next;
  }
  return patch as UpdatePatientRequest;
}

/** Resolves the id of an existing patient picked via the global search, if any. */
function resolveResolvedPatientId(
  snapshot: ExecutionSnapshot,
): string | undefined {
  const fromForm = snapshot.formValues.patient_id;
  if (typeof fromForm === "string" && fromForm.length > 0) return fromForm;
  return (
    snapshot.searchState.full_name?.resolvedEntityId?.id ??
    snapshot.searchState.patient_id?.resolvedEntityId?.id ??
    undefined
  );
}

type SubmitVisitArgs = {
  template: FormTemplateDto;
  snapshot: ExecutionSnapshot;
  /** Non-null = edit mode (PATCH); null = new booking (POST). */
  editingVisit: Visit | null;
  /** Whether the form is in medical-rep mode (`visitor_type === "MEDICAL_REP"`). */
  isMedicalRep: boolean;
  /** Active branch — stamped on new bookings. */
  branchId: string | null | undefined;
};

type SubmitVisitResult = {
  /** Id of the newly created visit (medical-rep create only); else undefined. */
  newVisitId?: string;
};

/**
 * Single entry point for the four visit write paths. Collapses the
 * `isEdit × isMedicalRep` matrix that used to be branched in two places
 * (the pending calc and the submit handler) into one `submit()` call, and
 * exposes a single combined `isPending`. Builds the payload via
 * {@link buildVisitPayload}; throws on API failure so the caller can map the
 * error (see `mapVisitApiError`).
 */
export function useSubmitVisit() {
  const bookVisit = useBookVisit();
  const bookMedicalRepVisit = useBookMedicalRepVisit();
  const updateVisit = useUpdateVisit();
  const updateMedRepVisit = useUpdateMedRepVisit();
  const updatePatient = useUpdatePatient();

  const isPending =
    bookVisit.isPending ||
    bookMedicalRepVisit.isPending ||
    updateVisit.isPending ||
    updateMedRepVisit.isPending ||
    updatePatient.isPending;

  async function submit({
    template,
    snapshot,
    editingVisit,
    isMedicalRep,
    branchId,
  }: SubmitVisitArgs): Promise<SubmitVisitResult> {
    const body = buildVisitPayload(template, snapshot, {
      isEdit: !!editingVisit,
      branchId,
    });

    // Identity fields are stripped from the booking payload when an existing
    // patient is resolved (see submission-builder), so demographic edits would
    // otherwise be lost. Write them back to the shared patient record first, so
    // a failed write surfaces before any visit is booked (clean to retry).
    if (!isMedicalRep) {
      const patientId = editingVisit
        ? editingVisit.kind !== "medical_rep"
          ? editingVisit.patient.id
          : undefined
        : resolveResolvedPatientId(snapshot);
      if (patientId) {
        let patch: UpdatePatientRequest | null = null;
        try {
          const current = (await fetchPatientById(patientId)).data;
          const data = buildPatientPatch(current, snapshot.formValues);
          if (Object.keys(data).length > 0) patch = data;
        } catch (error) {
          // A 404/403 means this caller can't read the patient (e.g. a
          // cross-org record not yet enrolled here): skip the write-back and
          // book by reference. Any other failure (network, 5xx) is real — let
          // it throw so the user's demographic edits aren't silently dropped.
          if (
            error instanceof ApiError &&
            (error.status === 404 || error.status === 403)
          ) {
            patch = null;
          } else {
            throw error;
          }
        }
        if (patch) {
          await updatePatient.mutateAsync({ id: patientId, data: patch });
        }
      }
    }

    if (editingVisit) {
      if (isMedicalRep) {
        await updateMedRepVisit.mutateAsync({
          visitId: editingVisit.id,
          body: body as unknown as UpdateMedicalRepVisitRequest,
        });
      } else {
        await updateVisit.mutateAsync({
          visitId: editingVisit.id,
          body: body as unknown as UpdateVisitRequest,
          branchId: editingVisit.branchId,
        });
      }
      return {};
    }

    if (isMedicalRep) {
      const res = await bookMedicalRepVisit.mutateAsync(
        body as unknown as BookMedicalRepVisitRequest,
      );
      return { newVisitId: res?.data?.visit?.id };
    }

    await bookVisit.mutateAsync(body as unknown as BookVisitRequest);
    return {};
  }

  return { submit, isPending };
}
