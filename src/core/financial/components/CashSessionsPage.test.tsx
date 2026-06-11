import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";
import type { CashSession } from "../types/financial.types";

// Controlled hook + auth-context mocks so the page renders deterministically.
const useCurrentCashSession = vi.fn();
const useCashSessions = vi.fn();
const noopMutation = () => ({ mutate: vi.fn(), isPending: false });

vi.mock("../hooks/useCashSessions", () => ({
  useCurrentCashSession: () => useCurrentCashSession(),
  useCashSessions: () => useCashSessions(),
  useOpenCashSession: () => noopMutation(),
  useCloseCashSession: () => noopMutation(),
  useReconcileCashSession: () => noopMutation(),
}));

vi.mock("@/features/auth/store/authContextStore", () => ({
  useAuthContextStore: (selector: (s: { branchId: string }) => unknown) =>
    selector({ branchId: "branch-1" }),
}));

import { CashSessionsPage } from "./CashSessionsPage";

function session(overrides: Partial<CashSession>): CashSession {
  return {
    id: "s1",
    organization_id: "org-1",
    branch_id: "branch-1",
    profile_id: "p1",
    opening_float: "0",
    opened_by_id: "p1",
    opened_at: "2026-06-01T08:00:00.000Z",
    closed_by_id: "p1",
    closed_at: "2026-06-01T17:00:00.000Z",
    expected_amount: "0",
    counted_amount: null,
    variance: "0",
    status: "CLOSED",
    notes: null,
    created_at: "2026-06-01T08:00:00.000Z",
    updated_at: "2026-06-01T17:00:00.000Z",
    ...overrides,
  };
}

describe("CashSessionsPage — opening float carry-forward", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCurrentCashSession.mockReturnValue({ session: null, isLoading: false });
  });

  it("prefills the opening float from the last closed session's counted amount", () => {
    useCashSessions.mockReturnValue({
      sessions: [
        session({ id: "s1", counted_amount: "350.00", status: "CLOSED" }),
      ],
      isLoading: false,
    });

    renderWithIntl(<CashSessionsPage />);
    fireEvent.click(screen.getByRole("button", { name: /open session/i }));

    expect(screen.getByRole("spinbutton")).toHaveValue(350);
    expect(screen.getByText(/carried from last session/i)).toBeInTheDocument();
  });

  it("defaults to 0 with no hint when there is no prior closed session", () => {
    useCashSessions.mockReturnValue({
      sessions: [
        session({ id: "s1", counted_amount: null, status: "OPEN" }),
      ],
      isLoading: false,
    });

    renderWithIntl(<CashSessionsPage />);
    fireEvent.click(screen.getByRole("button", { name: /open session/i }));

    expect(screen.getByRole("spinbutton")).toHaveValue(0);
    expect(
      screen.queryByText(/carried from last session/i),
    ).not.toBeInTheDocument();
  });

  it("picks the most recent closed/reconciled session by closed_at", () => {
    useCashSessions.mockReturnValue({
      sessions: [
        session({
          id: "old",
          counted_amount: "100.00",
          status: "RECONCILED",
          closed_at: "2026-06-01T17:00:00.000Z",
        }),
        session({
          id: "new",
          counted_amount: "420.00",
          status: "CLOSED",
          closed_at: "2026-06-05T17:00:00.000Z",
        }),
      ],
      isLoading: false,
    });

    renderWithIntl(<CashSessionsPage />);
    fireEvent.click(screen.getByRole("button", { name: /open session/i }));

    expect(screen.getByRole("spinbutton")).toHaveValue(420);
  });
});
