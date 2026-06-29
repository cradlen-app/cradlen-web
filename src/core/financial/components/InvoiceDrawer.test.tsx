import { screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";

const {
  useInvoiceMock,
  useVisitChargesMock,
  createState,
  buildState,
  appendState,
  updateState,
  issueState,
} = vi.hoisted(() => ({
  useInvoiceMock: vi.fn(),
  useVisitChargesMock: vi.fn(),
  createState: { mutateAsync: vi.fn(), isPending: false },
  buildState: { mutateAsync: vi.fn(), isPending: false },
  appendState: { mutate: vi.fn(), isPending: false },
  updateState: { mutate: vi.fn(), isPending: false },
  issueState: { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false },
}));

vi.mock("../hooks/useInvoice", () => ({
  useInvoice: (id: string | undefined) => useInvoiceMock(id),
}));
vi.mock("../hooks/useCharges", () => ({
  useVisitCharges: (id: string | undefined) => useVisitChargesMock(id),
}));
vi.mock("../hooks/useCreateInvoice", () => ({
  useCreateInvoice: () => createState,
}));
vi.mock("../hooks/useBuildInvoiceFromCharges", () => ({
  useBuildInvoiceFromCharges: () => buildState,
}));
vi.mock("../hooks/useAppendChargesToInvoice", () => ({
  useAppendChargesToInvoice: () => appendState,
}));
vi.mock("../hooks/useUpdateInvoice", () => ({
  useUpdateInvoice: () => updateState,
}));
vi.mock("../hooks/useIssueInvoice", () => ({
  useIssueInvoice: () => issueState,
}));
vi.mock("@/features/auth/store/authContextStore", () => ({
  useAuthContextStore: (
    sel: (s: {
      branchId: string;
      organizationId: string;
      profileId: string;
    }) => unknown,
  ) => sel({ branchId: "br-1", organizationId: "org-1", profileId: "doc-1" }),
}));

// Child surfaces have their own tests — stub them to isolate the drawer shell.
vi.mock("./InvoiceViewMode", () => ({
  InvoiceViewMode: () => <div data-testid="view-mode" />,
}));
vi.mock("./InvoiceEditForm", () => ({
  InvoiceEditForm: () => <div data-testid="edit-form" />,
}));
vi.mock("./InvoicePrintModal", () => ({ InvoicePrintModal: () => null }));
vi.mock("./RecordPaymentDrawer", () => ({ RecordPaymentDrawer: () => null }));
vi.mock("./VoidInvoiceDialog", () => ({ VoidInvoiceDialog: () => null }));

import { InvoiceDrawer } from "./InvoiceDrawer";
import type { Invoice } from "../types/financial.types";

function makeInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: "inv-1",
    organization_id: "org-1",
    branch_id: "br-1",
    patient_id: "pat-1",
    visit_id: null,
    assigned_doctor_id: "doc-1",
    invoice_number: "INV-001",
    invoice_type: "STANDARD",
    status: "ISSUED",
    subtotal: 300,
    discount_type: null,
    discount_value: null,
    discount_amount: 0,
    tax_amount: 0,
    total_amount: 300,
    paid_amount: 0,
    balance_due: 300,
    currency: "EGP",
    notes: null,
    issued_at: "2026-06-10T00:00:00.000Z",
    due_date: null,
    created_by_id: "user-1",
    items: [],
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

function renderDrawer(props: Partial<React.ComponentProps<typeof InvoiceDrawer>> = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderWithIntl(
    <QueryClientProvider client={qc}>
      <InvoiceDrawer open onOpenChange={vi.fn()} {...props} />
    </QueryClientProvider>,
  );
}

describe("InvoiceDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useVisitChargesMock.mockReturnValue({ charges: [] });
  });

  it("opens in create mode with the New Invoice title and the edit form", () => {
    useInvoiceMock.mockReturnValue({ invoice: undefined, isLoading: false });
    renderDrawer();

    expect(screen.getByText("New Invoice")).toBeInTheDocument();
    expect(screen.getByTestId("edit-form")).toBeInTheDocument();
    expect(screen.queryByTestId("view-mode")).not.toBeInTheDocument();
  });

  it("opens an existing issued invoice in view mode with its number and status badge", () => {
    useInvoiceMock.mockReturnValue({
      invoice: makeInvoice(),
      isLoading: false,
    });
    renderDrawer({ invoiceId: "inv-1" });

    expect(screen.getByText("Invoice #INV-001")).toBeInTheDocument();
    expect(screen.getByText("Issued")).toBeInTheDocument(); // status badge
    expect(screen.getByTestId("view-mode")).toBeInTheDocument();
    expect(screen.queryByTestId("edit-form")).not.toBeInTheDocument();
  });

  it("renders a skeleton while the invoice loads", () => {
    useInvoiceMock.mockReturnValue({ invoice: undefined, isLoading: true });
    renderDrawer({ invoiceId: "inv-1" });

    expect(screen.queryByTestId("view-mode")).not.toBeInTheDocument();
    // Radix Dialog content renders in a portal on document.body, not in container.
    expect(
      document.querySelectorAll(".animate-pulse").length,
    ).toBeGreaterThan(0);
  });

  it("shows the load-error state when an existing invoice cannot be fetched", () => {
    useInvoiceMock.mockReturnValue({ invoice: undefined, isLoading: false });
    renderDrawer({ invoiceId: "inv-404" });

    expect(
      screen.getByText(/Failed to load invoice/i),
    ).toBeInTheDocument();
  });

  it("opens an existing invoice (already mounted open) in view mode — edit is user-initiated", () => {
    // The drawer is mounted persistently; with an invoiceId present and no
    // closed→open transition, editMode stays false, so view mode is shown.
    useInvoiceMock.mockReturnValue({
      invoice: makeInvoice({ status: "DRAFT" }),
      isLoading: false,
    });
    renderDrawer({ invoiceId: "inv-1" });

    expect(screen.getByTestId("view-mode")).toBeInTheDocument();
    expect(screen.queryByTestId("edit-form")).not.toBeInTheDocument();
  });
});
