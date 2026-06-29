import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";
import { RepVisitDetailsDialog } from "./RepVisitDetailsDialog";
import type { MedicalRepVisitHistoryItem } from "../../types/medical-rep.types";

function makeItem(over: Partial<MedicalRepVisitHistoryItem> = {}): MedicalRepVisitHistoryItem {
  return {
    id: "v1",
    scheduled_at: "2026-06-01T09:00:00.000Z",
    completed_at: null,
    status: "COMPLETED",
    purpose: "PRODUCT_DETAILING",
    outcome: "SHARE_MATERIALS",
    samples_received: true,
    follow_up_date: "2026-07-01T00:00:00.000Z",
    notes: "Discussed pricing",
    products: [{ id: "p1", name: "Aspirin" }],
    ...over,
  };
}

describe("RepVisitDetailsDialog", () => {
  it("renders nothing when closed", () => {
    renderWithIntl(
      <RepVisitDetailsDialog item={makeItem()} open={false} onOpenChange={vi.fn()} />,
    );

    expect(screen.queryByText("Visit details")).not.toBeInTheDocument();
  });

  it("renders mapped purpose/outcome labels and products when open", () => {
    renderWithIntl(
      <RepVisitDetailsDialog item={makeItem()} open onOpenChange={vi.fn()} />,
    );

    expect(screen.getByText("Visit details")).toBeInTheDocument();
    expect(screen.getByText("Product detailing")).toBeInTheDocument();
    expect(screen.getByText("Share materials")).toBeInTheDocument();
    expect(screen.getByText("Samples received")).toBeInTheDocument();
    expect(screen.getByText("Aspirin")).toBeInTheDocument();
    expect(screen.getByText("Discussed pricing")).toBeInTheDocument();
  });

  it("omits the notes field when there are no notes", () => {
    renderWithIntl(
      <RepVisitDetailsDialog item={makeItem({ notes: null })} open onOpenChange={vi.fn()} />,
    );

    expect(screen.queryByText("Notes")).not.toBeInTheDocument();
  });

  it("shows the no-samples copy when samples were not received", () => {
    renderWithIntl(
      <RepVisitDetailsDialog
        item={makeItem({ samples_received: false, products: [] })}
        open
        onOpenChange={vi.fn()}
      />,
    );

    expect(screen.getByText("No samples received")).toBeInTheDocument();
  });
});
