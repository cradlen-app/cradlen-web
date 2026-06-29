import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithIntl } from "@/test/render";

import { InvoiceDetailsCard } from "./InvoiceDetailsCard";
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
    patient: { id: "pat-1", full_name: "Jane Doe" },
    doctor: { id: "doc-1", full_name: "Dr. House" },
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("InvoiceDetailsCard", () => {
  it("renders embedded patient + doctor names and the invoice type", () => {
    renderWithIntl(<InvoiceDetailsCard invoice={makeInvoice()} />);
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("Dr. House")).toBeInTheDocument();
    expect(screen.getByText("Standard")).toBeInTheDocument();
  });

  it("falls back to the raw id when the person relation is absent", () => {
    renderWithIntl(
      <InvoiceDetailsCard
        invoice={makeInvoice({ patient: null, doctor: null })}
      />,
    );
    expect(screen.getByText("pat-1")).toBeInTheDocument();
    expect(screen.getByText("doc-1")).toBeInTheDocument();
  });

  it("hides the notes block when there are no notes", () => {
    renderWithIntl(<InvoiceDetailsCard invoice={makeInvoice({ notes: null })} />);
    expect(screen.queryByText("Notes")).not.toBeInTheDocument();
  });

  it("shows the notes block when notes exist", () => {
    renderWithIntl(
      <InvoiceDetailsCard invoice={makeInvoice({ notes: "Pay later" })} />,
    );
    expect(screen.getByText("Notes")).toBeInTheDocument();
    expect(screen.getByText("Pay later")).toBeInTheDocument();
  });
});
