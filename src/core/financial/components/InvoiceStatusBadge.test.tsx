import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithIntl } from "@/test/render";

import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { InvoicePricingSourceBadge } from "./InvoicePricingSourceBadge";

describe("InvoiceStatusBadge", () => {
  it("renders the translated label for each status", () => {
    renderWithIntl(<InvoiceStatusBadge status="PARTIALLY_PAID" />);
    expect(screen.getByText("Partially Paid")).toBeInTheDocument();
  });

  it("applies the status accent style and merges a custom className", () => {
    renderWithIntl(<InvoiceStatusBadge status="PAID" className="extra-class" />);
    const badge = screen.getByText("Paid");
    expect(badge).toHaveClass("extra-class");
    // Paid → emerald accent (from STATUS_STYLES)
    expect(badge.className).toContain("emerald");
  });
});

describe("InvoicePricingSourceBadge", () => {
  it("renders the translated label for a pricing source", () => {
    renderWithIntl(<InvoicePricingSourceBadge source="PROVIDER_OVERRIDE" />);
    expect(screen.getByText("Provider Price")).toBeInTheDocument();
  });

  it("uses the source-specific accent style", () => {
    renderWithIntl(<InvoicePricingSourceBadge source="CUSTOM" />);
    const badge = screen.getByText("Custom");
    expect(badge.className).toContain("amber");
  });
});
