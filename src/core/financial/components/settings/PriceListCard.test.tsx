import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";

const {
  usePriceListItemsMock,
  deleteMutate,
  setDefaultMutate,
  toggleActiveMutate,
  addMutate,
  updateMutate,
  removeMutate,
  bulkMutate,
} = vi.hoisted(() => ({
  usePriceListItemsMock: vi.fn(),
  deleteMutate: vi.fn(),
  setDefaultMutate: vi.fn(),
  toggleActiveMutate: vi.fn(),
  addMutate: vi.fn(),
  updateMutate: vi.fn(),
  removeMutate: vi.fn(),
  bulkMutate: vi.fn(),
}));

vi.mock("../../hooks/usePriceListItems", () => ({
  usePriceListItems: (id: string | null) => usePriceListItemsMock(id),
}));
vi.mock("../../hooks/useAddPriceListItem", () => ({
  useAddPriceListItem: () => ({ mutate: addMutate, isPending: false }),
}));
vi.mock("../../hooks/useUpdatePriceListItem", () => ({
  useUpdatePriceListItem: () => ({ mutate: updateMutate, isPending: false }),
}));
vi.mock("../../hooks/useRemovePriceListItem", () => ({
  useRemovePriceListItem: () => ({ mutate: removeMutate, isPending: false }),
}));
vi.mock("../../hooks/useDeletePriceList", () => ({
  useDeletePriceList: () => ({ mutate: deleteMutate, isPending: false }),
}));
vi.mock("../../hooks/usePriceListActions", () => ({
  useBulkSetPriceListItems: () => ({ mutate: bulkMutate, isPending: false }),
  useSetDefaultPriceList: () => ({ mutate: setDefaultMutate, isPending: false }),
  useTogglePriceListActive: () => ({ mutate: toggleActiveMutate, isPending: false }),
}));
vi.mock("../../lib/services.api", () => ({
  fetchServices: vi.fn(() => Promise.resolve({ data: [] })),
}));
vi.mock("@/features/auth/store/authContextStore", () => ({
  useAuthContextStore: (sel: (s: { organizationId: string }) => unknown) =>
    sel({ organizationId: "org-1" }),
}));
// Keep the nested edit drawer out of the way (it has its own hooks/tests).
vi.mock("./PriceListDrawer", () => ({ PriceListDrawer: () => null }));

import { PriceListCard } from "./PriceListCard";
import type { PriceList, PriceListItem } from "../../types/financial.types";

function makeList(overrides: Partial<PriceList> = {}): PriceList {
  return {
    id: "pl-1",
    organization_id: "org-1",
    branch_id: null,
    name: "Standard 2026",
    currency: "EGP",
    is_default: false,
    is_active: true,
    valid_from: null,
    valid_to: null,
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

const ITEM: PriceListItem = {
  id: "pli-1",
  price_list_id: "pl-1",
  service_id: "svc-1",
  unit_price: 250,
  is_active: true,
  created_at: "2026-06-01T00:00:00.000Z",
  updated_at: "2026-06-01T00:00:00.000Z",
  service: { id: "svc-1", name: "Consultation", code: "CONSULT", service_type: "CONSULTATION" },
};

describe("PriceListCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePriceListItemsMock.mockReturnValue({ items: [], isLoading: false });
  });

  it("renders the org scope badge and the list name", () => {
    renderWithIntl(<PriceListCard priceList={makeList()} />);
    expect(screen.getByText("Org")).toBeInTheDocument();
    expect(screen.getByText("Standard 2026")).toBeInTheDocument();
  });

  it("renders the branch scope badge for a branch-scoped list", () => {
    renderWithIntl(<PriceListCard priceList={makeList({ branch_id: "br-1" })} />);
    expect(screen.getByText("Branch")).toBeInTheDocument();
  });

  it("shows the default badge and hides the set-default action for the default list", () => {
    renderWithIntl(<PriceListCard priceList={makeList({ is_default: true })} />);
    expect(screen.getByText("Default")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Set default" }),
    ).not.toBeInTheDocument();
  });

  it("shows the inactive badge for a deactivated list", () => {
    renderWithIntl(<PriceListCard priceList={makeList({ is_active: false })} />);
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("sets the list as default", () => {
    renderWithIntl(<PriceListCard priceList={makeList()} />);
    fireEvent.click(screen.getByRole("button", { name: "Set default" }));
    expect(setDefaultMutate).toHaveBeenCalledWith("pl-1");
  });

  it("toggles the active state", () => {
    renderWithIntl(<PriceListCard priceList={makeList({ is_active: true })} />);
    fireEvent.click(screen.getByRole("button", { name: "Deactivate" }));
    expect(toggleActiveMutate).toHaveBeenCalledWith({ id: "pl-1", active: false });
  });

  it("loads and renders price items when expanded", () => {
    usePriceListItemsMock.mockReturnValue({ items: [ITEM], isLoading: false });
    renderWithIntl(<PriceListCard priceList={makeList()} />);
    fireEvent.click(screen.getByRole("button", { name: "Expand" }));

    expect(screen.getByText("Consultation")).toBeInTheDocument();
    expect(screen.getByText("EGP 250.00")).toBeInTheDocument();
  });

  it("shows the empty items state when expanded with no items", () => {
    usePriceListItemsMock.mockReturnValue({ items: [], isLoading: false });
    renderWithIntl(<PriceListCard priceList={makeList()} />);
    fireEvent.click(screen.getByRole("button", { name: "Expand" }));
    expect(screen.getByText("No items yet — add one below.")).toBeInTheDocument();
  });

  it("deletes the list after confirming in the dialog", () => {
    renderWithIntl(<PriceListCard priceList={makeList()} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete price list" }));

    // Confirmation dialog action.
    const confirm = screen.getByRole("button", { name: "Delete" });
    fireEvent.click(confirm);
    expect(deleteMutate).toHaveBeenCalledWith("pl-1", expect.any(Object));
  });
});
