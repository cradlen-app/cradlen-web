"use client";

import { MedicalRepVisitPage } from "@/features/medical-rep/components/visit/MedicalRepVisitPage";
import { VisitWorkspacePage } from "./VisitWorkspacePage";

type Props = {
  visitId: string;
  /** From the `?kind=` query param. `medical_rep` → rep workspace, else patient. */
  kind?: string;
};

/**
 * Unified visit-workspace dispatcher. Both visit kinds live under
 * `/dashboard/visits/:id`; the `kind` query param (set by every in-app link and
 * the booking redirect) selects the rep vs patient workspace body — they use
 * different APIs and tab layouts, so we cannot share a single body.
 */
export function VisitWorkspaceSwitch({ visitId, kind }: Props) {
  if (kind === "medical_rep") {
    return <MedicalRepVisitPage visitId={visitId} />;
  }
  return <VisitWorkspacePage visitId={visitId} />;
}
