import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";
import type { BillingQueueItem } from "../hooks/useBillingQueue";

const { useBillingQueueMock, drawerPropsSpy } = vi.hoisted(() => ({
  useBillingQueueMock: vi.fn(),
  drawerPropsSpy: vi.fn(),
}));

vi.mock("../hooks/useBillingQueue", () => ({
  useBillingQueue: () => useBillingQueueMock(),
}));

vi.mock("@/features/auth/store/authContextStore", () => ({
  useAuthContextStore: (selector: (s: { branchId: string }) => unknown) =>
    selector({ branchId: "branch-1" }),
}));

// Capture what the drawer is opened with instead of rendering the real one.
vi.mock("./InvoiceDrawer", () => ({
  InvoiceDrawer: (props: { open: boolean; invoiceId?: string }) => {
    drawerPropsSpy(props);
    return props.open ? (
      <div data-testid="invoice-drawer" data-invoice-id={props.invoiceId ?? ""} />
    ) : null;
  },
}));

vi.mock("./CollectChargesDrawer", () => ({
  CollectChargesDrawer: () => null,
}));

import { InvoicePanel } from "./InvoicePanel";

function makeItem(over?: Partial<BillingQueueItem>): BillingQueueItem {
  return {
    visit: {
      id: "visit-1",
      patient: { id: "pat-1", fullName: "Jane Doe" },
      assignedDoctorId: "doc-1",
      assignedDoctorName: "Dr. Sara",
    },
    invoice: { id: "inv-9", status: "ISSUED", balance_due: 0, currency: "EGP" },
    ...over,
  } as unknown as BillingQueueItem;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("InvoicePanel auto-open deep-link", () => {
  it("opens the invoice drawer for the matching queued visit", () => {
    useBillingQueueMock.mockReturnValue({
      pending: [makeItem()],
      invoiced: [],
      isLoading: false,
    });

    renderWithIntl(
      <InvoicePanel open={false} onOpenChange={() => {}} autoOpenVisitId="visit-1" />,
    );

    const drawer = screen.getByTestId("invoice-drawer");
    expect(drawer).toHaveAttribute("data-invoice-id", "inv-9");
  });

  it("does not open the drawer when no queued visit matches", () => {
    useBillingQueueMock.mockReturnValue({
      pending: [makeItem()],
      invoiced: [],
      isLoading: false,
    });

    renderWithIntl(
      <InvoicePanel
        open={false}
        onOpenChange={() => {}}
        autoOpenVisitId="visit-unknown"
      />,
    );

    expect(screen.queryByTestId("invoice-drawer")).toBeNull();
  });
});
