import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";

import { renderWithIntl } from "@/test/render";
import type { Visit } from "../types/visits.types";

// ── Data-hook mocks ───────────────────────────────────────────────────────────
const mockResolve = vi.fn();
vi.mock("@/features/examination/lib/specialty-resolver", () => ({
  resolveSpecialtyExamination: (code: string | null, id: string) =>
    mockResolve(code, id),
}));

const mockExamQuery = vi.fn();
const patchMutate = vi.fn();
vi.mock("@/features/examination/api/useVisitExamination", () => ({
  useVisitExamination: (path: string | null) => mockExamQuery(path),
  usePatchVisitExamination: () => ({ mutateAsync: patchMutate, isPending: false }),
}));

const updateVisitMutate = vi.fn();
vi.mock("../hooks/useUpdateVisit", () => ({
  useUpdateVisit: () => ({ mutateAsync: updateVisitMutate, isPending: false }),
}));

const updateStatusMutate = vi.fn();
vi.mock("../hooks/useUpdateVisitStatus", () => ({
  useUpdateVisitStatus: () => ({ mutateAsync: updateStatusMutate, isPending: false }),
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: { success: (m: string) => toastSuccess(m), error: (m: string) => toastError(m) },
}));

import { CompleteVisitDialog } from "./CompleteVisitDialog";

function makeVisit(over: Partial<Visit> = {}): Visit {
  return {
    id: "v-1",
    branchId: "br-1",
    queueNumber: 1,
    type: "VISIT",
    status: "IN_CONSULTATION",
    priority: "NORMAL",
    createdAt: "2026-06-28T08:00:00.000Z",
    patient: { id: "p-1", firstName: "Sara", lastName: "Mahmoud", fullName: "Sara Mahmoud" },
    ...over,
  } as Visit;
}

const examConfig = {
  slug: "obgyn",
  templateCode: "obgyn_examination",
  endpointPath: "/visits/v-1/examination",
};

describe("CompleteVisitDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when closed", () => {
    mockResolve.mockReturnValue(null);
    mockExamQuery.mockReturnValue({ data: null, isLoading: false });
    renderWithIntl(
      <CompleteVisitDialog open={false} onOpenChange={() => {}} visit={makeVisit()} />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("blocks submit and shows a required error when the complaint is empty", async () => {
    mockResolve.mockReturnValue(null);
    mockExamQuery.mockReturnValue({ data: null, isLoading: false });
    renderWithIntl(
      <CompleteVisitDialog
        open
        onOpenChange={() => {}}
        visit={makeVisit({ chiefComplaint: undefined })}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /complete|submit/i }));
    // visits.actions.completeRequiresChiefComplaint.required
    await waitFor(() =>
      expect(screen.getByText("Main complaint is required.")).toBeInTheDocument(),
    );
    expect(updateStatusMutate).not.toHaveBeenCalled();
  });

  it("uses the examination PATCH path then completes when a config + envelope exist", async () => {
    mockResolve.mockReturnValue(examConfig);
    mockExamQuery.mockReturnValue({
      data: { chief_complaint: "Nausea", provisional_diagnosis: "" },
      isLoading: false,
    });
    patchMutate.mockResolvedValue(undefined);
    updateStatusMutate.mockResolvedValue(undefined);
    const onOpenChange = vi.fn();
    const onCompleted = vi.fn();

    renderWithIntl(
      <CompleteVisitDialog
        open
        onOpenChange={onOpenChange}
        onCompleted={onCompleted}
        visit={makeVisit({ specialtyCode: "OBGYN" })}
      />,
    );

    // Fill the (required) diagnosis field since a config is present.
    const textareas = screen.getAllByRole("textbox");
    fireEvent.change(textareas[1], { target: { value: "First-trimester pregnancy" } });

    fireEvent.click(screen.getByRole("button", { name: /complete|submit/i }));

    await waitFor(() => expect(patchMutate).toHaveBeenCalledTimes(1));
    expect(patchMutate).toHaveBeenCalledWith({
      body: {
        chief_complaint: "Nausea",
        provisional_diagnosis: "First-trimester pregnancy",
      },
    });
    expect(updateStatusMutate).toHaveBeenCalledWith({
      visitId: "v-1",
      status: "COMPLETED",
      branchId: "br-1",
    });
    expect(updateVisitMutate).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onCompleted).toHaveBeenCalledTimes(1);
    expect(toastSuccess).toHaveBeenCalled();
  });

  it("falls back to the visit intake PATCH when there is no examination surface", async () => {
    mockResolve.mockReturnValue(null);
    mockExamQuery.mockReturnValue({ data: null, isLoading: false });
    updateVisitMutate.mockResolvedValue(undefined);
    updateStatusMutate.mockResolvedValue(undefined);

    renderWithIntl(
      <CompleteVisitDialog
        open
        onOpenChange={vi.fn()}
        visit={makeVisit({ chiefComplaint: "Headache" })}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /complete|submit/i }));

    await waitFor(() => expect(updateVisitMutate).toHaveBeenCalledTimes(1));
    expect(updateVisitMutate).toHaveBeenCalledWith({
      visitId: "v-1",
      body: { chief_complaint: "Headache" },
      branchId: "br-1",
    });
    expect(patchMutate).not.toHaveBeenCalled();
    expect(updateStatusMutate).toHaveBeenCalledWith({
      visitId: "v-1",
      status: "COMPLETED",
      branchId: "br-1",
    });
  });

  it("surfaces an error toast when the mutation rejects", async () => {
    mockResolve.mockReturnValue(null);
    mockExamQuery.mockReturnValue({ data: null, isLoading: false });
    updateVisitMutate.mockRejectedValue(new Error("boom"));

    renderWithIntl(
      <CompleteVisitDialog
        open
        onOpenChange={vi.fn()}
        visit={makeVisit({ chiefComplaint: "Headache" })}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /complete|submit/i }));
    await waitFor(() => expect(toastError).toHaveBeenCalled());
  });
});
