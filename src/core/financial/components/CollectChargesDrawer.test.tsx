import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";

const { useVisitChargesMock, buildMutate, buildState } = vi.hoisted(() => ({
  useVisitChargesMock: vi.fn(),
  buildMutate: vi.fn(),
  buildState: { isPending: false },
}));

vi.mock("../hooks/useCharges", () => ({
  useVisitCharges: (visitId: string | undefined) => useVisitChargesMock(visitId),
}));

vi.mock("../hooks/useBuildInvoiceFromCharges", () => ({
  useBuildInvoiceFromCharges: () => ({
    mutate: buildMutate,
    isPending: buildState.isPending,
  }),
}));

import { CollectChargesDrawer } from "./CollectChargesDrawer";
import type { Charge } from "../types/financial.types";

function makeCharge(overrides: Partial<Charge> = {}): Charge {
  return {
    id: "chg-1",
    organization_id: "org-1",
    branch_id: "br-1",
    patient_id: "pat-1",
    visit_id: "vis-1",
    profile_id: "doc-1",
    service_id: "svc-1",
    description: "X-Ray",
    quantity: 2,
    unit_price: 100,
    currency: "EGP",
    pricing_source: "ORG_PRICE_LIST",
    source: "DOCTOR",
    status: "PENDING",
    captured_by_id: "doc-1",
    captured_at: "2026-06-10T00:00:00.000Z",
    created_at: "2026-06-10T00:00:00.000Z",
    updated_at: "2026-06-10T00:00:00.000Z",
    ...overrides,
  };
}

function renderDrawer() {
  const onOpenChange = vi.fn();
  const onBuilt = vi.fn();
  renderWithIntl(
    <CollectChargesDrawer
      open
      onOpenChange={onOpenChange}
      branchId="br-1"
      patientId="pat-1"
      visitId="vis-1"
      onBuilt={onBuilt}
    />,
  );
  return { onOpenChange, onBuilt };
}

describe("CollectChargesDrawer", () => {
  beforeEach(() => {
    useVisitChargesMock.mockReset();
    buildMutate.mockReset();
    buildState.isPending = false;
  });

  it("shows a loading state", () => {
    useVisitChargesMock.mockReturnValue({ charges: [], isLoading: true });
    renderDrawer();
    expect(screen.getByText("Loading charges…")).toBeInTheDocument();
  });

  it("shows the empty state and disables Build when there are no open charges", () => {
    useVisitChargesMock.mockReturnValue({ charges: [], isLoading: false });
    renderDrawer();
    expect(
      screen.getByText("No open charges for this visit."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Build invoice" })).toBeDisabled();
  });

  it("lists only PENDING charges and sums their total", () => {
    useVisitChargesMock.mockReturnValue({
      charges: [
        makeCharge(),
        makeCharge({ id: "chg-2", status: "INVOICED", description: "Lab" }),
      ],
      isLoading: false,
    });
    renderDrawer();

    expect(screen.getByText("X-Ray")).toBeInTheDocument();
    expect(screen.queryByText("Lab")).not.toBeInTheDocument();
    // 200 appears as the line total and again in the footer grand total.
    expect(screen.getAllByText("EGP 200.00")).toHaveLength(2);
  });

  it("builds an invoice from the pending charge ids and reports the new id", () => {
    useVisitChargesMock.mockReturnValue({
      charges: [makeCharge()],
      isLoading: false,
    });
    buildMutate.mockImplementation(
      (_payload: unknown, opts: { onSuccess: (r: { data: { id: string } }) => void }) =>
        opts.onSuccess({ data: { id: "inv-99" } }),
    );
    const { onOpenChange, onBuilt } = renderDrawer();

    fireEvent.click(screen.getByRole("button", { name: "Build invoice" }));

    expect(buildMutate).toHaveBeenCalledWith(
      {
        branch_id: "br-1",
        patient_id: "pat-1",
        visit_id: "vis-1",
        charge_ids: ["chg-1"],
      },
      expect.any(Object),
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onBuilt).toHaveBeenCalledWith("inv-99");
  });
});
