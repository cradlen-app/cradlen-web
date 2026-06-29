import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";

import { getInvoicePermissions } from "../lib/invoiceActions";
import type { Invoice, Payment } from "../types/financial.types";

const { useInvoiceDetailMock } = vi.hoisted(() => ({
  useInvoiceDetailMock: vi.fn(),
}));

vi.mock("../hooks/useInvoiceDetail", () => ({
  useInvoiceDetail: (id: string) => useInvoiceDetailMock(id),
}));

// Stub the heavy action drawers/dialogs — they own their own data wiring and are
// exercised in their own tests. Here we only assert the detail body renders and
// the state toggles that open them.
vi.mock("./RecordPaymentDrawer", () => ({
  RecordPaymentDrawer: ({ open }: { open: boolean }) =>
    open ? <div data-testid="record-payment-drawer" /> : null,
}));
vi.mock("./RefundDrawer", () => ({
  RefundDrawer: ({ open }: { open: boolean }) =>
    open ? <div data-testid="refund-drawer" /> : null,
}));
vi.mock("./ReceiptPrintModal", () => ({
  ReceiptPrintModal: ({ open }: { open: boolean }) =>
    open ? <div data-testid="receipt-modal" /> : null,
}));
vi.mock("./VoidInvoiceDialog", () => ({
  VoidInvoiceDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="void-invoice-dialog" /> : null,
}));
vi.mock("./InvoiceDrawer", () => ({
  InvoiceDrawer: ({ open }: { open: boolean }) =>
    open ? <div data-testid="invoice-edit-drawer" /> : null,
}));

import { InvoiceDetailView } from "./InvoiceDetailView";

function invoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: "inv-1",
    organization_id: "org-1",
    branch_id: "br-1",
    patient_id: "pat-1",
    visit_id: null,
    assigned_doctor_id: null,
    invoice_number: "INV-4004",
    invoice_type: "STANDARD",
    status: "DRAFT",
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
    created_by_id: "u1",
    items: [
      {
        id: "it-1",
        invoice_id: "inv-1",
        service_id: "svc-1",
        description: "Consultation",
        quantity: 1,
        unit_price: 200,
        currency: "EGP",
        discount_amount: 0,
        total_amount: 200,
        pricing_source: "CUSTOM",
        created_at: "2026-06-01",
        updated_at: "2026-06-01",
      },
    ],
    created_at: "2026-06-01",
    updated_at: "2026-06-01",
    ...overrides,
  };
}

function detail(overrides: Record<string, unknown> = {}) {
  return {
    invoice: invoice(),
    isLoading: false,
    payments: [] as Payment[],
    paymentsLoading: false,
    refunds: [],
    receiptByPayment: new Map(),
    permissions: getInvoicePermissions("DRAFT"),
    issueMutation: { isPending: false, mutate: vi.fn() },
    voidPaymentMutation: { isPending: false, mutate: vi.fn() },
    voidRefundMutation: { isPending: false, mutate: vi.fn() },
    ...overrides,
  };
}

describe("InvoiceDetailView", () => {
  beforeEach(() => {
    useInvoiceDetailMock.mockReset();
  });

  it("shows the loading skeleton while loading", () => {
    useInvoiceDetailMock.mockReturnValue(detail({ isLoading: true, invoice: undefined }));
    const { container } = renderWithIntl(<InvoiceDetailView invoiceId="inv-1" />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("shows the not-found message when the invoice is missing", () => {
    useInvoiceDetailMock.mockReturnValue(detail({ invoice: null }));
    renderWithIntl(<InvoiceDetailView invoiceId="inv-1" />);
    expect(screen.getByText("Invoice not found.")).toBeInTheDocument();
  });

  it("renders the header, items and details for a loaded invoice", () => {
    useInvoiceDetailMock.mockReturnValue(detail());
    renderWithIntl(<InvoiceDetailView invoiceId="inv-1" />);
    expect(screen.getByText("INV-4004")).toBeInTheDocument();
    expect(screen.getByText("Consultation")).toBeInTheDocument();
  });

  it("opens the void dialog and edit drawer from the header actions", () => {
    useInvoiceDetailMock.mockReturnValue(detail());
    renderWithIntl(<InvoiceDetailView invoiceId="inv-1" />);

    expect(screen.queryByTestId("void-invoice-dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Void" }));
    expect(screen.getByTestId("void-invoice-dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByTestId("invoice-edit-drawer")).toBeInTheDocument();
  });

  it("fires the issue mutation from the header", () => {
    const d = detail();
    useInvoiceDetailMock.mockReturnValue(d);
    renderWithIntl(<InvoiceDetailView invoiceId="inv-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Issue Invoice" }));
    expect((d.issueMutation as { mutate: ReturnType<typeof vi.fn> }).mutate).toHaveBeenCalledWith("inv-1");
  });

  it("opens the record-payment drawer for an issued invoice", () => {
    useInvoiceDetailMock.mockReturnValue(
      detail({
        invoice: invoice({ status: "ISSUED" }),
        permissions: getInvoicePermissions("ISSUED"),
      }),
    );
    renderWithIntl(<InvoiceDetailView invoiceId="inv-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Record Payment" }));
    expect(screen.getByTestId("record-payment-drawer")).toBeInTheDocument();
  });
});
