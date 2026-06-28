import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";

import type { Invoice } from "../types/financial.types";

const { useInvoiceMock, useParamsMock } = vi.hoisted(() => ({
  useInvoiceMock: vi.fn(),
  useParamsMock: vi.fn(),
}));

vi.mock("../hooks/useInvoice", () => ({
  useInvoice: (id: string) => useInvoiceMock(id),
}));

vi.mock("next/navigation", () => ({
  useParams: () => useParamsMock(),
}));

vi.mock("./InvoiceDetailView", () => ({
  InvoiceDetailView: ({ invoiceId }: { invoiceId: string }) => (
    <div data-testid="detail-view">{invoiceId}</div>
  ),
}));

import { InvoiceDetailPage } from "./InvoiceDetailPage";

function invoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: "inv-1",
    organization_id: "org-1",
    branch_id: "br-1",
    patient_id: "pat-1",
    visit_id: null,
    assigned_doctor_id: null,
    invoice_number: "INV-5005",
    invoice_type: "STANDARD",
    status: "ISSUED",
    subtotal: 0,
    discount_type: null,
    discount_value: null,
    discount_amount: 0,
    tax_amount: 0,
    total_amount: 0,
    paid_amount: 0,
    balance_due: 0,
    currency: "EGP",
    notes: null,
    issued_at: null,
    due_date: null,
    created_by_id: "u1",
    items: [],
    created_at: "2026-06-01",
    updated_at: "2026-06-01",
    ...overrides,
  };
}

describe("InvoiceDetailPage", () => {
  beforeEach(() => {
    useInvoiceMock.mockReset();
    useParamsMock.mockReset();
    useParamsMock.mockReturnValue({ locale: "en", orgId: "org-1", branchId: "br-1" });
  });

  it("renders the invoice number in the breadcrumb and embeds the detail view", () => {
    useInvoiceMock.mockReturnValue({ invoice: invoice() });
    renderWithIntl(<InvoiceDetailPage invoiceId="inv-1" />);

    expect(screen.getByText("INV-5005")).toBeInTheDocument();
    expect(screen.getByText("Invoices")).toBeInTheDocument();
    expect(screen.getByTestId("detail-view")).toHaveTextContent("inv-1");
  });

  it("shows the loading label in the breadcrumb until the invoice arrives", () => {
    useInvoiceMock.mockReturnValue({ invoice: undefined });
    renderWithIntl(<InvoiceDetailPage invoiceId="inv-1" />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("builds the invoices breadcrumb href from the route params", () => {
    useInvoiceMock.mockReturnValue({ invoice: invoice() });
    renderWithIntl(<InvoiceDetailPage invoiceId="inv-1" />);
    expect(screen.getByRole("link", { name: "Invoices" })).toHaveAttribute(
      "href",
      "/en/org-1/br-1/dashboard/financial/invoices",
    );
  });
});
