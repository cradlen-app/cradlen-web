"use client";

import type { ExecutionSnapshot } from "@/builder/templates/submission-builder";
import type { FormTemplateDto } from "@/builder/templates/template.types";
import { buildVisitPayload } from "../lib/visit-submission";
import { useBookVisit } from "./useBookVisit";
import { useBookMedicalRepVisit } from "./useBookMedicalRepVisit";
import { useUpdateVisit, type UpdateVisitRequest } from "./useUpdateVisit";
import { useUpdateMedRepVisit } from "./useUpdateMedRepVisit";
import type {
  BookMedicalRepVisitRequest,
  BookVisitRequest,
  UpdateMedicalRepVisitRequest,
} from "../types/visits.api.types";
import type { Visit } from "../types/visits.types";

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

  const isPending =
    bookVisit.isPending ||
    bookMedicalRepVisit.isPending ||
    updateVisit.isPending ||
    updateMedRepVisit.isPending;

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
