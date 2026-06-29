import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";

import { InvoicePrintModal } from "./InvoicePrintModal";
import type { Invoice } from "../types/financial.types";

function invoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: "inv-1",
    organization_id: "org-1",
    branch_id: "br-1",
    patient_id: "pat-1",
    visit_id: null,
    assigned_doctor_id: "doc-1",
    invoice_number: "INV-2002",
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

describe("InvoicePrintModal", () => {
  it("renders nothing visible when closed", () => {
    renderWithIntl(
      <InvoicePrintModal open={false} onOpenChange={vi.fn()} invoice={invoice()} />,
    );
    expect(screen.queryByText("Consultation")).not.toBeInTheDocument();
  });

  it("renders the invoice number in the chrome and the preview body when open", () => {
    renderWithIntl(
      <InvoicePrintModal
        open
        onOpenChange={vi.fn()}
        invoice={invoice()}
        patientName="Jane Roe"
        doctorName="Dr. Smith"
      />,
    );
    // Chrome title "Invoice INV-2002" and preview both render.
    expect(screen.getAllByText(/INV-2002/).length).toBeGreaterThan(0);
    expect(screen.getByText("Jane Roe")).toBeInTheDocument();
    expect(screen.getByText("Consultation")).toBeInTheDocument();
  });

  it("invokes window.print when the print button is clicked", () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});
    renderWithIntl(
      <InvoicePrintModal open onOpenChange={vi.fn()} invoice={invoice()} />,
    );
    screen.getByRole("button", { name: "Print" }).click();
    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });

  it("derives the provider name from the embedded doctor when no display name is passed", () => {
    renderWithIntl(
      <InvoicePrintModal
        open
        onOpenChange={vi.fn()}
        invoice={invoice({ doctor: { id: "doc-1", full_name: "Embedded Doctor" } })}
      />,
    );
    expect(screen.getByText(/Embedded Doctor/)).toBeInTheDocument();
  });
});
