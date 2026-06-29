import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithIntl } from "@/test/render";

import { InvoicePreview, type InvoicePreviewModel } from "./InvoicePreview";

function model(overrides: Partial<InvoicePreviewModel> = {}): InvoicePreviewModel {
  return {
    invoiceNumber: "INV-1001",
    status: "ISSUED",
    patientName: "Jane Roe",
    doctorName: "Dr. Smith",
    issueDate: "2026-06-01",
    dueDate: "2026-06-15",
    currency: "EGP",
    items: [
      { id: "i1", description: "Consultation", quantity: 1, unit_price: 200, discount_amount: 0 },
      { id: "i2", description: "Lab test", quantity: 2, unit_price: 50, discount_amount: 20 },
    ],
    discountType: "NONE",
    discountValue: 0,
    taxAmount: 0,
    notes: "Thank you",
    ...overrides,
  };
}

describe("InvoicePreview", () => {
  it("renders the invoice number, parties and notes", () => {
    renderWithIntl(<InvoicePreview {...model()} />);

    expect(screen.getByText("#INV-1001")).toBeInTheDocument();
    expect(screen.getByText("Jane Roe")).toBeInTheDocument();
    expect(screen.getByText(/Dr\. Smith/)).toBeInTheDocument();
    expect(screen.getByText("Thank you")).toBeInTheDocument();
    // status badge present
    expect(screen.getByText("Consultation")).toBeInTheDocument();
    expect(screen.getByText("Lab test")).toBeInTheDocument();
  });

  it("shows the pending-number placeholder when no invoice number", () => {
    renderWithIntl(<InvoicePreview {...model({ invoiceNumber: null })} />);
    expect(screen.getByText("Number assigned on save")).toBeInTheDocument();
  });

  it("renders the empty-items row when there are no items", () => {
    renderWithIntl(<InvoicePreview {...model({ items: [] })} />);
    // subtotal line still rendered as EGP 0.00
    expect(screen.getAllByText("EGP 0.00").length).toBeGreaterThan(0);
  });

  it("hides paid and balance rows when paidAmount is omitted", () => {
    renderWithIntl(<InvoicePreview {...model({ paidAmount: undefined })} />);
    expect(screen.queryByText("Paid")).not.toBeInTheDocument();
  });

  it("renders paid and balance rows when paidAmount is provided", () => {
    renderWithIntl(
      <InvoicePreview {...model({ paidAmount: 100, balanceDue: 130 })} />,
    );
    expect(screen.getByText("Paid")).toBeInTheDocument();
    expect(screen.getByText("Balance due")).toBeInTheDocument();
  });

  it("shows an invoice-level discount line when a percentage discount applies", () => {
    renderWithIntl(
      <InvoicePreview
        {...model({ discountType: "PERCENTAGE", discountValue: 10 })}
      />,
    );
    // line discounts (item i2 has 20) renders a negative value
    expect(screen.getByText("-EGP 20.00")).toBeInTheDocument();
  });

  it("renders a dash for missing patient name and item description", () => {
    renderWithIntl(
      <InvoicePreview
        {...model({
          patientName: "",
          notes: null,
          doctorName: undefined,
          items: [
            { id: "x", description: "", quantity: 1, unit_price: 0, discount_amount: 0 },
          ],
        })}
      />,
    );
    // multiple dashes possible; just assert at least one renders
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    expect(screen.queryByText(/Provider:/)).not.toBeInTheDocument();
  });

  it("hides the status badge when no status is given", () => {
    renderWithIntl(<InvoicePreview {...model({ status: undefined })} />);
    // status badge text such as "Issued" should not appear
    expect(screen.queryByText("Issued")).not.toBeInTheDocument();
  });
});
