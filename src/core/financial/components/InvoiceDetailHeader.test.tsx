import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";

import { InvoiceDetailHeader } from "./InvoiceDetailHeader";
import { getInvoicePermissions } from "../lib/invoiceActions";
import type { Invoice } from "../types/financial.types";

function invoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: "inv-1",
    organization_id: "org-1",
    branch_id: "br-1",
    patient_id: "pat-1",
    visit_id: null,
    assigned_doctor_id: null,
    invoice_number: "INV-3003",
    invoice_type: "STANDARD",
    status: "DRAFT",
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
    issued_at: null,
    due_date: null,
    created_by_id: "u1",
    items: [],
    created_at: "2026-06-01",
    updated_at: "2026-06-01",
    ...overrides,
  };
}

const handlers = {
  onVoid: vi.fn(),
  onEdit: vi.fn(),
  onIssue: vi.fn(),
  onRecordPayment: vi.fn(),
};

describe("InvoiceDetailHeader", () => {
  it("renders DRAFT actions (void/edit/issue) and routes callbacks", () => {
    renderWithIntl(
      <InvoiceDetailHeader
        invoice={invoice({ status: "DRAFT" })}
        permissions={getInvoicePermissions("DRAFT")}
        issuing={false}
        {...handlers}
      />,
    );
    expect(screen.getByText("INV-3003")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Void" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.click(screen.getByRole("button", { name: "Issue Invoice" }));
    expect(handlers.onVoid).toHaveBeenCalled();
    expect(handlers.onEdit).toHaveBeenCalled();
    expect(handlers.onIssue).toHaveBeenCalled();
    // No record-payment button on a draft.
    expect(screen.queryByRole("button", { name: "Record Payment" })).not.toBeInTheDocument();
  });

  it("renders the record-payment action and a balance-due line for an ISSUED invoice", () => {
    renderWithIntl(
      <InvoiceDetailHeader
        invoice={invoice({ status: "ISSUED", paid_amount: 100, total_amount: 300 })}
        permissions={getInvoicePermissions("ISSUED")}
        issuing={false}
        {...handlers}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Record Payment" }));
    expect(handlers.onRecordPayment).toHaveBeenCalled();
    // remaining = 200 → balance due line
    expect(screen.getByText(/Balance due/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Issue Invoice" })).not.toBeInTheDocument();
  });

  it("disables the issue button while issuing", () => {
    renderWithIntl(
      <InvoiceDetailHeader
        invoice={invoice({ status: "DRAFT" })}
        permissions={getInvoicePermissions("DRAFT")}
        issuing
        {...handlers}
      />,
    );
    expect(screen.getByRole("button", { name: "Issue Invoice" })).toBeDisabled();
  });

  it("hides the balance-due line when nothing remains", () => {
    renderWithIntl(
      <InvoiceDetailHeader
        invoice={invoice({ status: "PAID", paid_amount: 300, total_amount: 300 })}
        permissions={getInvoicePermissions("PAID")}
        issuing={false}
        {...handlers}
      />,
    );
    expect(screen.queryByText(/Balance due/)).not.toBeInTheDocument();
  });
});
