import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";
import type { Invoice } from "../types/financial.types";

const { useInvoicesMock } = vi.hoisted(() => ({ useInvoicesMock: vi.fn() }));

vi.mock("../hooks/useInvoices", () => ({
  useInvoices: (filters: unknown) => useInvoicesMock(filters),
}));

vi.mock("@/hooks/useDashboardPath", () => ({
  useDashboardPath:
    () =>
    (path = "") =>
      `/org-1/branch-1/dashboard${path}`,
}));

vi.mock("@/features/auth/store/authContextStore", () => ({
  useAuthContextStore: (selector: (state: unknown) => unknown) =>
    selector({
      organizationId: "org-1",
      branchId: "branch-1",
      profileId: "p1",
    }),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { InvoiceSearchPage } from "./InvoiceSearchPage";

function makeInvoice(over: Partial<Invoice> = {}): Invoice {
  return {
    id: "inv-1",
    organization_id: "org-1",
    branch_id: "branch-1",
    patient_id: "pat-uuid-1",
    visit_id: null,
    episode_id: null,
    assigned_doctor_id: null,
    invoice_number: "INV-2026-00001",
    invoice_type: "STANDARD",
    status: "ISSUED",
    subtotal: 200,
    discount_type: null,
    discount_value: null,
    discount_amount: 0,
    tax_amount: 0,
    total_amount: 200,
    paid_amount: 0,
    balance_due: 200,
    currency: "EGP",
    notes: null,
    issued_at: null,
    due_date: null,
    created_by_id: "p1",
    items: [],
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z",
    ...over,
  };
}

const BASE_RETURN = {
  invoices: [],
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 1,
  isLoading: false,
  isFetching: false,
  error: undefined,
};

function lastFilters() {
  return useInvoicesMock.mock.calls.at(-1)?.[0];
}

describe("InvoiceSearchPage", () => {
  beforeEach(() => {
    useInvoicesMock.mockReset();
    useInvoicesMock.mockReturnValue(BASE_RETURN);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the patient name from the embedded relation, not the id", () => {
    useInvoicesMock.mockReturnValue({
      ...BASE_RETURN,
      total: 1,
      invoices: [
        makeInvoice({
          patient: { id: "pat-uuid-1", full_name: "Alice Adams" },
        }),
      ],
    });

    renderWithIntl(<InvoiceSearchPage />);

    expect(screen.getByText("Alice Adams")).toBeInTheDocument();
    expect(screen.queryByText("pat-uuid-1")).not.toBeInTheDocument();
  });

  it("falls back to the patient id when the relation is absent", () => {
    useInvoicesMock.mockReturnValue({
      ...BASE_RETURN,
      total: 1,
      invoices: [makeInvoice({ patient: null })],
    });

    renderWithIntl(<InvoiceSearchPage />);

    expect(screen.getByText("pat-uuid-1")).toBeInTheDocument();
  });

  it("passes a debounced search to the hook and resets to page 1", () => {
    vi.useFakeTimers();
    renderWithIntl(<InvoiceSearchPage />);

    // Initial call carries no search.
    expect(lastFilters()).toMatchObject({ page: 1, limit: 10 });
    expect(lastFilters().search).toBeUndefined();

    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "alice" } });

    // Before the debounce elapses, the hook hasn't received the term yet.
    expect(lastFilters().search).toBeUndefined();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(lastFilters()).toMatchObject({ search: "alice", page: 1 });
  });

  it("renders pagination and advances the page argument on Next", () => {
    useInvoicesMock.mockReturnValue({
      ...BASE_RETURN,
      total: 25,
      totalPages: 3,
      invoices: [makeInvoice()],
    });

    renderWithIntl(<InvoiceSearchPage />);

    const prev = screen.getByRole("button", { name: /previous/i });
    const next = screen.getByRole("button", { name: /next/i });
    expect(prev).toBeDisabled();
    expect(next).toBeEnabled();

    fireEvent.click(next);

    expect(lastFilters()).toMatchObject({ page: 2 });
  });

  it("shows the total count from meta, not the number of rows on the page", () => {
    useInvoicesMock.mockReturnValue({
      ...BASE_RETURN,
      total: 25,
      totalPages: 3,
      invoices: [makeInvoice()],
    });

    renderWithIntl(<InvoiceSearchPage />);

    // resultsCount renders "25 invoices" even though one row is present.
    expect(screen.getByText(/25/)).toBeInTheDocument();
  });

  it("scopes the query to the active branch so branch staff aren't denied", () => {
    renderWithIntl(<InvoiceSearchPage />);

    expect(lastFilters()).toMatchObject({ branch_id: "branch-1" });
  });

  it("surfaces a load failure instead of masking it as an empty list", () => {
    useInvoicesMock.mockReturnValue({
      ...BASE_RETURN,
      error: new Error("Request failed with status 403"),
    });

    renderWithIntl(<InvoiceSearchPage />);

    expect(
      screen.getByText("Couldn't load invoices. Please try again."),
    ).toBeInTheDocument();
    expect(screen.queryByText("No invoices found.")).not.toBeInTheDocument();
  });
});
