import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithIntl } from "@/test/render";

import { InvoiceTotalsPanel } from "./InvoiceTotalsPanel";
import type { Invoice } from "../types/financial.types";

const ITEMS = [
  { unit_price: 100, quantity: 2, discount_amount: 0 }, // 200
  { unit_price: 50, quantity: 1, discount_amount: 10 }, // 50, -10 line discount
];

describe("InvoiceTotalsPanel", () => {
  it("shows the subtotal and the summed line discounts", () => {
    renderWithIntl(<InvoiceTotalsPanel items={ITEMS} currency="EGP" />);
    expect(screen.getByText("Subtotal")).toBeInTheDocument();
    expect(screen.getByText("EGP 250.00")).toBeInTheDocument(); // 200 + 50
    expect(screen.getByText("Line discounts")).toBeInTheDocument();
    expect(screen.getByText("-EGP 10.00")).toBeInTheDocument();
  });

  it("renders an invoice-level percentage discount row", () => {
    renderWithIntl(
      <InvoiceTotalsPanel
        items={ITEMS}
        currency="EGP"
        discountType="PERCENTAGE"
        discountValue={10}
      />,
    );
    // afterLine = 240, 10% = 24
    expect(screen.getByText("Invoice discount")).toBeInTheDocument();
    expect(screen.getByText("-EGP 24.00")).toBeInTheDocument();
  });

  it("omits the Paid / Balance rows for an unsaved draft (no invoice)", () => {
    renderWithIntl(<InvoiceTotalsPanel items={ITEMS} currency="EGP" />);
    expect(screen.queryByText("Paid")).not.toBeInTheDocument();
    expect(screen.queryByText("Balance due")).not.toBeInTheDocument();
  });

  it("shows authoritative Paid / Balance rows from a saved invoice snapshot", () => {
    const invoice = {
      tax_amount: 0,
      paid_amount: 100,
      balance_due: 140,
    } as Invoice;
    renderWithIntl(
      <InvoiceTotalsPanel items={ITEMS} currency="EGP" invoice={invoice} />,
    );
    expect(screen.getByText("Paid")).toBeInTheDocument();
    expect(screen.getByText("EGP 100.00")).toBeInTheDocument();
    expect(screen.getByText("Balance due")).toBeInTheDocument();
    expect(screen.getByText("EGP 140.00")).toBeInTheDocument();
  });
});
