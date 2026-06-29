import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithIntl } from "@/test/render";

import { InvoiceItemsTable } from "./InvoiceItemsTable";
import type { InvoiceItem } from "../types/financial.types";

function makeItem(overrides: Partial<InvoiceItem> = {}): InvoiceItem {
  return {
    id: "item-1",
    invoice_id: "inv-1",
    service_id: "svc-1",
    description: "Consultation",
    quantity: 2,
    unit_price: 150,
    currency: "EGP",
    discount_amount: 0,
    total_amount: 300,
    pricing_source: "ORG_PRICE_LIST",
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("InvoiceItemsTable", () => {
  it("renders the line-item description, unit price, pricing source and total", () => {
    renderWithIntl(
      <InvoiceItemsTable items={[makeItem()]} currency="EGP" />,
    );
    expect(screen.getByText("Consultation")).toBeInTheDocument();
    expect(screen.getByText("EGP 150.00")).toBeInTheDocument(); // unit price
    expect(screen.getByText("Org Price List")).toBeInTheDocument(); // pricing badge
    // 300 shows as the line total and again in the totals panel (subtotal/total).
    expect(screen.getAllByText("EGP 300.00").length).toBeGreaterThan(0);
  });

  it("hides the unit-price / pricing-source / discount columns in dense mode", () => {
    renderWithIntl(
      <InvoiceItemsTable items={[makeItem()]} currency="EGP" dense />,
    );
    // Dense layout drops the pricing-source column entirely.
    expect(screen.queryByText("Org Price List")).not.toBeInTheDocument();
    expect(screen.queryByText("Pricing Source")).not.toBeInTheDocument();
    // Description + total still shown.
    expect(screen.getByText("Consultation")).toBeInTheDocument();
    expect(screen.getAllByText("EGP 300.00").length).toBeGreaterThan(0);
  });

  it("renders an em-dash when a line has no discount", () => {
    renderWithIntl(
      <InvoiceItemsTable items={[makeItem({ discount_amount: 0 })]} currency="EGP" />,
    );
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
