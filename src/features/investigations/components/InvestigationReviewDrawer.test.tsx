import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithIntl } from "@/test/render";
import type { InvestigationReview } from "../types/investigation-review.types";

let storeState: { openId: string | null; close: () => void };
const close = vi.fn();
const mutateAsync = vi.fn();
const useInvestigationReview = vi.fn();
const useSubmitInvestigationReview = vi.fn();

vi.mock("../store/investigationReviewStore", () => ({
  useInvestigationReviewStore: (selector: (s: unknown) => unknown) =>
    selector(storeState),
}));

vi.mock("../hooks/useInvestigationReview", () => ({
  useInvestigationReview: (id: string | null) => useInvestigationReview(id),
  useSubmitInvestigationReview: () => useSubmitInvestigationReview(),
}));

import { InvestigationReviewDrawer } from "./InvestigationReviewDrawer";

function makeReview(overrides: Partial<InvestigationReview> = {}): InvestigationReview {
  return {
    id: "inv-1",
    patientName: "Laila Hassan",
    visitId: "visit-7",
    status: "RESULTED",
    updatedAt: "2026-06-20T10:00:00.000Z",
    typeLabel: "Lab",
    testName: "Complete Blood Count",
    reason: "Routine screening",
    attachments: [{ id: "a1", url: "https://example.com/result.png" }],
    doctorNotes: "",
    ...overrides,
  } as InvestigationReview;
}

beforeEach(() => {
  vi.clearAllMocks();
  storeState = { openId: "inv-1", close };
  mutateAsync.mockResolvedValue(makeReview());
  useSubmitInvestigationReview.mockReturnValue({ mutateAsync, isPending: false });
  useInvestigationReview.mockReturnValue({ data: makeReview(), isLoading: false });
});

describe("InvestigationReviewDrawer", () => {
  it("renders nothing visible when closed (openId is null)", () => {
    storeState = { openId: null, close };
    renderWithIntl(<InvestigationReviewDrawer />);
    expect(screen.queryByText("Complete Blood Count")).not.toBeInTheDocument();
  });

  it("renders the loading skeleton while the review is loading", () => {
    useInvestigationReview.mockReturnValue({ data: undefined, isLoading: true });
    renderWithIntl(<InvestigationReviewDrawer />);
    // Detail values are not present while loading
    expect(screen.queryByText("Laila Hassan")).not.toBeInTheDocument();
  });

  it("renders the review details when loaded", () => {
    renderWithIntl(<InvestigationReviewDrawer />);
    expect(screen.getByText("Laila Hassan")).toBeInTheDocument();
    expect(screen.getByText("visit-7")).toBeInTheDocument();
    expect(screen.getByText("Complete Blood Count")).toBeInTheDocument();
    expect(screen.getByText("Routine screening")).toBeInTheDocument();
    // Status label localized
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("renders the no-result placeholder when there are no attachments", () => {
    useInvestigationReview.mockReturnValue({
      data: makeReview({ attachments: [] }),
      isLoading: false,
    });
    renderWithIntl(<InvestigationReviewDrawer />);
    expect(screen.getByText("No result uploaded yet")).toBeInTheDocument();
  });

  it("submits notes and closes the drawer on save", async () => {
    renderWithIntl(<InvestigationReviewDrawer />);
    const textarea = screen.getByPlaceholderText("Add your review notes…");
    fireEvent.change(textarea, { target: { value: "Looks normal" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({
        id: "inv-1",
        notes: "Looks normal",
      }),
    );
    await waitFor(() => expect(close).toHaveBeenCalled());
  });

  it("shows the saving label while the mutation is pending", () => {
    useSubmitInvestigationReview.mockReturnValue({ mutateAsync, isPending: true });
    renderWithIntl(<InvestigationReviewDrawer />);
    expect(screen.getByRole("button", { name: "Saving…" })).toBeInTheDocument();
  });
});
