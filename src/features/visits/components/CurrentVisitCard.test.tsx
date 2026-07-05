import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";

import { renderWithIntl } from "@/test/render";
import type { Visit } from "../types/visits.types";

// ── Navigation / auth / hook mocks ────────────────────────────────────────────
const routerPush = vi.fn();
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: routerPush }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/features/auth/hooks/useCurrentUser", () => ({
  useCurrentUser: () => ({ data: { profiles: [] } }),
}));

vi.mock("@/features/auth/lib/current-user", () => ({
  getActiveProfile: () => ({ role: "DOCTOR" }),
}));

const mockCanClinical = vi.fn();
vi.mock("@/features/auth/lib/permissions", () => ({
  canDriveClinicalVisit: (...a: unknown[]) => mockCanClinical(...a),
}));

vi.mock("@/features/auth/store/authContextStore", () => ({
  useAuthContextStore: (selector: (s: Record<string, string>) => unknown) =>
    selector({ branchId: "br-1", organizationId: "org-1", profileId: "prof-1" }),
}));

const startVisitMutate = vi.fn();
vi.mock("../hooks/useStartVisit", () => ({
  useStartVisit: () => ({ mutateAsync: startVisitMutate, isPending: false }),
}));

let currentRows: Visit[] = [];
vi.mock("../hooks/useUnifiedCurrentVisit", () => ({
  useUnifiedMyCurrentVisit: () => ({ data: currentRows, isLoading: false }),
}));

import { CurrentVisitCard } from "./CurrentVisitCard";

function makeVisit(over: Partial<Visit> = {}): Visit {
  return {
    id: "v-1",
    kind: "patient",
    branchId: "br-1",
    queueNumber: 1,
    type: "VISIT",
    status: "IN_PROGRESS",
    priority: "NORMAL",
    createdAt: "2026-07-05T08:00:00.000Z",
    patient: { id: "p-1", firstName: "Sara", lastName: "Mahmoud", fullName: "Sara Mahmoud" },
    assignedDoctorId: "doc-1",
    assignedDoctorName: "Dr. Hala Younis",
    chiefComplaint: "Nausea",
    ...over,
  } as Visit;
}

describe("CurrentVisitCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentRows = [];
    mockCanClinical.mockReturnValue(true);
  });

  it("opens the rep workspace on a medical-rep row without calling startVisit", async () => {
    currentRows = [
      makeVisit({
        id: "mr-1",
        kind: "medical_rep",
        type: "MEDICAL_REP",
        status: "IN_PROGRESS",
        patient: { id: "rep-1", firstName: "", lastName: "", fullName: "Waleed Ahmed" },
      }),
    ];

    renderWithIntl(<CurrentVisitCard branchId="br-1" organizationId="org-1" />);

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() =>
      expect(routerPush).toHaveBeenCalledWith(
        "/org-1/br-1/dashboard/visits/mr-1?kind=medical_rep",
      ),
    );
    expect(startVisitMutate).not.toHaveBeenCalled();
  });

  it("starts a patient visit via startVisit and then opens the workspace", async () => {
    startVisitMutate.mockResolvedValueOnce(undefined);
    currentRows = [makeVisit({ id: "v-9", kind: "patient", status: "IN_PROGRESS" })];

    renderWithIntl(<CurrentVisitCard branchId="br-1" organizationId="org-1" />);

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() =>
      expect(startVisitMutate).toHaveBeenCalledWith({ branchId: "br-1", visitId: "v-9" }),
    );
    await waitFor(() =>
      expect(routerPush).toHaveBeenCalledWith("/org-1/br-1/dashboard/visits/v-9"),
    );
  });
});
