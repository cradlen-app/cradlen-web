import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";

const {
  useServicesMock,
  useVisitChargesMock,
  useResolvePriceMock,
  captureMutate,
  cancelMutate,
  updateMutate,
  voidMutate,
  writeOffMutate,
  captureState,
} = vi.hoisted(() => ({
  useServicesMock: vi.fn(),
  useVisitChargesMock: vi.fn(),
  useResolvePriceMock: vi.fn(),
  captureMutate: vi.fn(),
  cancelMutate: vi.fn(),
  updateMutate: vi.fn(),
  voidMutate: vi.fn(),
  writeOffMutate: vi.fn(),
  captureState: { isPending: false },
}));

vi.mock("../hooks/useServices", () => ({
  useServices: (filters?: unknown) => useServicesMock(filters),
}));

vi.mock("../hooks/useResolvePrice", () => ({
  useResolvePrice: (...args: unknown[]) => useResolvePriceMock(...args),
}));

vi.mock("../hooks/useCharges", () => ({
  useVisitCharges: (visitId: string | undefined) => useVisitChargesMock(visitId),
  useCaptureCharge: () => ({ mutate: captureMutate, isPending: captureState.isPending }),
  useCancelCharge: () => ({ mutate: cancelMutate, isPending: false }),
  useUpdateCharge: () => ({ mutate: updateMutate, isPending: false }),
  useVoidCharge: () => ({ mutate: voidMutate, isPending: false }),
  useWriteOffCharge: () => ({ mutate: writeOffMutate, isPending: false }),
}));

import { AddChargeDrawer } from "./AddChargeDrawer";
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
    description: "Consultation",
    quantity: 1,
    unit_price: 150,
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

const SERVICES = [
  { id: "svc-1", name: "Consultation" },
  { id: "svc-2", name: "X-Ray" },
];

function renderDrawer() {
  renderWithIntl(
    <AddChargeDrawer
      open
      onOpenChange={vi.fn()}
      branchId="br-1"
      patientId="pat-1"
      profileId="doc-1"
      visitId="vis-1"
    />,
  );
}

describe("AddChargeDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    captureState.isPending = false;
    useServicesMock.mockReturnValue({ services: SERVICES });
    useVisitChargesMock.mockReturnValue({ charges: [], isLoading: false });
    useResolvePriceMock.mockReturnValue({ resolvedPrice: undefined });
  });

  it("renders the service options and disables Add until a service is chosen", () => {
    renderDrawer();
    expect(
      screen.getByRole("option", { name: "Consultation" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "X-Ray" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Charge" })).toBeDisabled();
  });

  it("shows the resolved price once a service is selected", () => {
    useResolvePriceMock.mockReturnValue({
      resolvedPrice: { price: 150, currency: "EGP", source: "ORG_PRICE_LIST" },
    });
    renderDrawer();
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "svc-1" },
    });
    expect(screen.getByText("Resolved price: EGP 150.00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Charge" })).toBeEnabled();
  });

  it("captures a charge with the chosen service, quantity and custom price", () => {
    renderDrawer();
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "svc-2" },
    });
    // qty is the first number input, custom price the second
    const numberInputs = screen.getAllByRole("spinbutton");
    fireEvent.change(numberInputs[0], { target: { value: "3" } });
    fireEvent.change(numberInputs[1], { target: { value: "200" } });

    fireEvent.click(screen.getByRole("button", { name: "Add Charge" }));

    expect(captureMutate).toHaveBeenCalledWith(
      {
        branch_id: "br-1",
        patient_id: "pat-1",
        profile_id: "doc-1",
        visit_id: "vis-1",
        service_id: "svc-2",
        quantity: 3,
        unit_price: 200,
      },
      expect.any(Object),
    );
  });

  it("lists existing charges and exposes void / write-off actions for pending ones", () => {
    useVisitChargesMock.mockReturnValue({
      // Description chosen to not collide with a <select> service option.
      charges: [makeCharge({ description: "Follow-up review" })],
      isLoading: false,
    });
    renderDrawer();

    expect(screen.getByText("Follow-up review")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Void charge" }));
    expect(voidMutate).toHaveBeenCalledWith("chg-1");

    fireEvent.click(screen.getByRole("button", { name: "Write off charge" }));
    expect(writeOffMutate).toHaveBeenCalledWith("chg-1");

    fireEvent.click(screen.getByRole("button", { name: "Cancel charge" }));
    expect(cancelMutate).toHaveBeenCalledWith("chg-1");
  });

  it("hides row actions for a non-pending (already invoiced) charge", () => {
    useVisitChargesMock.mockReturnValue({
      charges: [makeCharge({ status: "INVOICED" })],
      isLoading: false,
    });
    renderDrawer();
    expect(
      screen.queryByRole("button", { name: "Void charge" }),
    ).not.toBeInTheDocument();
  });

  it("shows the empty charges state", () => {
    renderDrawer();
    expect(screen.getByText("No charges yet.")).toBeInTheDocument();
  });
});
