import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";

import type { Invoice } from "../types/financial.types";

vi.mock("./InvoicePaymentsPanel", () => ({
  InvoicePaymentsPanel: () => <div data-testid="payments-panel" />,
}));

import { InvoiceViewMode } from "./InvoiceViewMode";

function invoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: "inv-1",
    organization_id: "org-1",
    branch_id: "br-1",
    patient_id: "pat-1",
    visit_id: "visit-9",
    assigned_doctor_id: "doc-1",
    invoice_number: "INV-1001",
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
    notes: "Some notes",
    issued_at: "2026-06-01",
    due_date: "2026-06-15",
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

const baseHandlers = {
  onPrint: vi.fn(),
  onVoid: vi.fn(),
  onEdit: vi.fn(),
  onIssue: vi.fn(),
  onAppendCharges: vi.fn(),
  onRecordPayment: vi.fn(),
};

const baseFlags = {
  canVoid: false,
  canEdit: false,
  canIssue: false,
  canAppendCharges: false,
  canRecordPayment: false,
  pendingChargeCount: 0,
  issuing: false,
  appending: false,
};

describe("InvoiceViewMode", () => {
  it("renders patient/doctor/visit/type/notes info and line items", () => {
    renderWithIntl(
      <InvoiceViewMode
        invoice={invoice()}
        patientName="Jane Roe"
        doctorName="Dr. Smith"
        {...baseFlags}
        {...baseHandlers}
      />,
    );

    expect(screen.getByText("Jane Roe")).toBeInTheDocument();
    expect(screen.getByText("Dr. Smith")).toBeInTheDocument();
    expect(screen.getByText("visit-9")).toBeInTheDocument();
    expect(screen.getByText("Standard")).toBeInTheDocument();
    expect(screen.getByText("Some notes")).toBeInTheDocument();
    expect(screen.getByText("Consultation")).toBeInTheDocument();
  });

  it("hides the payments panel for DRAFT invoices", () => {
    renderWithIntl(
      <InvoiceViewMode invoice={invoice({ status: "DRAFT" })} {...baseFlags} {...baseHandlers} />,
    );
    expect(screen.queryByTestId("payments-panel")).not.toBeInTheDocument();
  });

  it("renders the payments panel for non-DRAFT invoices", () => {
    renderWithIntl(
      <InvoiceViewMode invoice={invoice({ status: "ISSUED" })} {...baseFlags} {...baseHandlers} />,
    );
    expect(screen.getByTestId("payments-panel")).toBeInTheDocument();
  });

  it("always renders Print and fires its callback", () => {
    renderWithIntl(
      <InvoiceViewMode invoice={invoice()} {...baseFlags} {...baseHandlers} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Print" }));
    expect(baseHandlers.onPrint).toHaveBeenCalled();
  });

  it("shows the gated action buttons and routes their callbacks", () => {
    renderWithIntl(
      <InvoiceViewMode
        invoice={invoice()}
        {...baseFlags}
        canVoid
        canEdit
        canIssue
        canAppendCharges
        canRecordPayment
        pendingChargeCount={3}
        {...baseHandlers}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Void" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.click(screen.getByRole("button", { name: "Issue Invoice" }));
    fireEvent.click(screen.getByRole("button", { name: /Add new charges/ }));
    fireEvent.click(screen.getByRole("button", { name: "Record Payment" }));

    expect(baseHandlers.onVoid).toHaveBeenCalled();
    expect(baseHandlers.onEdit).toHaveBeenCalled();
    expect(baseHandlers.onIssue).toHaveBeenCalled();
    expect(baseHandlers.onAppendCharges).toHaveBeenCalled();
    expect(baseHandlers.onRecordPayment).toHaveBeenCalled();
  });

  it("hides the append-charges button when there are no pending charges", () => {
    renderWithIntl(
      <InvoiceViewMode
        invoice={invoice()}
        {...baseFlags}
        canAppendCharges
        pendingChargeCount={0}
        {...baseHandlers}
      />,
    );
    expect(screen.queryByRole("button", { name: /Add new charges/ })).not.toBeInTheDocument();
  });

  it("disables issue/append buttons while their actions are in flight", () => {
    renderWithIntl(
      <InvoiceViewMode
        invoice={invoice()}
        {...baseFlags}
        canIssue
        canAppendCharges
        pendingChargeCount={2}
        issuing
        appending
        {...baseHandlers}
      />,
    );
    expect(screen.getByRole("button", { name: "Issue Invoice" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Add new charges/ })).toBeDisabled();
  });

  it("falls back to embedded names/ids when display names are not passed", () => {
    renderWithIntl(
      <InvoiceViewMode
        invoice={invoice({
          patient: { id: "pat-1", full_name: "Embedded Patient" },
          doctor: { id: "doc-1", full_name: "Embedded Doctor" },
        })}
        {...baseFlags}
        {...baseHandlers}
      />,
    );
    expect(screen.getByText("Embedded Patient")).toBeInTheDocument();
    expect(screen.getByText("Embedded Doctor")).toBeInTheDocument();
  });
});
