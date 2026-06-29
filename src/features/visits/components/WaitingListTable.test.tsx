import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor, within } from "@testing-library/react";

import { renderWithIntl } from "@/test/render";
import type { Visit } from "../types/visits.types";

// ── Navigation / auth / hook mocks ────────────────────────────────────────────
const routerPush = vi.fn();
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: routerPush }),
}));

vi.mock("@/features/auth/hooks/useCurrentUser", () => ({
  useCurrentUser: () => ({ data: { profiles: [] } }),
}));

vi.mock("@/features/auth/lib/current-user", () => ({
  getActiveProfile: () => ({ role: "RECEPTION" }),
}));

const mockCanClinical = vi.fn();
const mockCanReception = vi.fn();
vi.mock("@/features/auth/lib/permissions", () => ({
  canDriveClinicalVisit: (...a: unknown[]) => mockCanClinical(...a),
  canDriveReceptionVisit: (...a: unknown[]) => mockCanReception(...a),
}));

vi.mock("@/features/auth/store/authContextStore", () => ({
  useAuthContextStore: (selector: (s: Record<string, string>) => unknown) =>
    selector({ branchId: "br-1", organizationId: "org-1", profileId: "prof-1" }),
}));

const patientStatusMutate = vi.fn();
vi.mock("../hooks/useUpdateVisitStatus", () => ({
  useUpdateVisitStatus: () => ({ mutateAsync: patientStatusMutate, isPending: false }),
}));

const medRepStatusMutate = vi.fn();
vi.mock("../hooks/useUpdateMedRepVisitStatus", () => ({
  useUpdateMedRepVisitStatus: () => ({ mutateAsync: medRepStatusMutate, isPending: false }),
}));

vi.mock("./BookVisitDrawer", () => ({
  BookVisitDrawer: ({ open }: { open: boolean }) => (
    <div data-testid="book-drawer" data-open={open} />
  ),
}));

import { WaitingListTable } from "./WaitingListTable";

function makeVisit(over: Partial<Visit> = {}): Visit {
  return {
    id: "v-1",
    branchId: "br-1",
    queueNumber: 1,
    type: "VISIT",
    status: "CHECKED_IN",
    priority: "NORMAL",
    createdAt: "2026-06-28T08:00:00.000Z",
    patient: { id: "p-1", firstName: "Sara", lastName: "Mahmoud", fullName: "Sara Mahmoud" },
    assignedDoctorName: "Dr. Hala Younis",
    chiefComplaint: "Nausea",
    ...over,
  } as Visit;
}

const noop = () => {};

describe("WaitingListTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCanClinical.mockReturnValue(false);
    mockCanReception.mockReturnValue(true);
  });

  it("renders the error state with a working retry button", () => {
    const onRetry = vi.fn();
    renderWithIntl(
      <WaitingListTable
        rows={[]}
        isLoading={false}
        isError
        canManageStatus
        onRetry={onRetry}
      />,
    );
    expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders a skeleton while loading", () => {
    const { container } = renderWithIntl(
      <WaitingListTable
        rows={[]}
        isLoading
        isError={false}
        canManageStatus
        onRetry={noop}
      />,
    );
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("renders the empty state when there are no rows", () => {
    renderWithIntl(
      <WaitingListTable
        rows={[]}
        isLoading={false}
        isError={false}
        canManageStatus
        onRetry={noop}
      />,
    );
    expect(screen.getByText(/no visits match/i)).toBeInTheDocument();
  });

  it("renders patient, doctor and queue data for each row", () => {
    renderWithIntl(
      <WaitingListTable
        rows={[makeVisit(), makeVisit({ id: "v-2", queueNumber: 2, patient: { id: "p-2", firstName: "Mona", lastName: "Adel", fullName: "Mona Adel" } })]}
        isLoading={false}
        isError={false}
        canManageStatus
        onRetry={noop}
      />,
    );
    expect(screen.getByText("Sara Mahmoud")).toBeInTheDocument();
    expect(screen.getByText("Mona Adel")).toBeInTheDocument();
    expect(screen.getAllByText("Dr. Hala Younis")).toHaveLength(2);
  });

  it("commits a reception status change via the patient mutation", async () => {
    renderWithIntl(
      <WaitingListTable
        rows={[makeVisit()]}
        isLoading={false}
        isError={false}
        canManageStatus
        onRetry={noop}
      />,
    );
    const select = screen.getByLabelText("Change status") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "IN_PROGRESS" } });
    await waitFor(() => expect(patientStatusMutate).toHaveBeenCalledTimes(1));
    expect(patientStatusMutate).toHaveBeenCalledWith({
      visitId: "v-1",
      status: "IN_PROGRESS",
      branchId: "br-1",
    });
  });

  it("opens a confirmation dialog before cancelling", async () => {
    renderWithIntl(
      <WaitingListTable
        rows={[makeVisit()]}
        isLoading={false}
        isError={false}
        canManageStatus
        onRetry={noop}
      />,
    );
    const select = screen.getByLabelText("Change status") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "CANCELLED" } });
    // No mutation yet — the confirmation dialog gates it.
    expect(patientStatusMutate).not.toHaveBeenCalled();
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /yes, cancel/i }));
    await waitFor(() => expect(patientStatusMutate).toHaveBeenCalledTimes(1));
    expect(patientStatusMutate).toHaveBeenCalledWith({
      visitId: "v-1",
      status: "CANCELLED",
      branchId: "br-1",
    });
  });

  it("shows a read-only badge instead of a select for terminal visits", () => {
    renderWithIntl(
      <WaitingListTable
        rows={[makeVisit({ status: "COMPLETED" })]}
        isLoading={false}
        isError={false}
        canManageStatus
        onRetry={noop}
      />,
    );
    expect(screen.queryByLabelText("Change status")).not.toBeInTheDocument();
    expect(screen.getByText(/completed/i)).toBeInTheDocument();
  });

  it("offers a doctor a Start Visit button for an in-consultation visit", () => {
    renderWithIntl(
      <WaitingListTable
        rows={[makeVisit({ status: "IN_CONSULTATION" })]}
        isLoading={false}
        isError={false}
        canManageStatus={false}
        isDoctor
        onRetry={noop}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /start visit/i }));
    expect(routerPush).toHaveBeenCalledWith(
      "/org-1/br-1/dashboard/visits/v-1",
    );
  });

  it("opens the edit drawer when the pencil action is clicked", () => {
    renderWithIntl(
      <WaitingListTable
        rows={[makeVisit()]}
        isLoading={false}
        isError={false}
        canManageStatus
        onRetry={noop}
      />,
    );
    expect(screen.getByTestId("book-drawer").dataset.open).toBe("false");
    fireEvent.click(screen.getByRole("button", { name: /edit visit/i }));
    expect(screen.getByTestId("book-drawer").dataset.open).toBe("true");
  });
});
