import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";
import type { Service } from "../../types/financial.types";

const { useServicesMock, deleteMutate, toggleMutate } = vi.hoisted(() => ({
  useServicesMock: vi.fn(),
  deleteMutate: vi.fn(),
  toggleMutate: vi.fn(),
}));

vi.mock("../../hooks/useServices", () => ({
  useServices: () => useServicesMock(),
}));
vi.mock("../../hooks/useDeleteService", () => ({
  useDeleteService: () => ({ mutate: deleteMutate, isPending: false }),
}));
vi.mock("../../hooks/useServiceActions", () => ({
  useToggleServiceActive: () => ({ mutate: toggleMutate, isPending: false }),
}));
vi.mock("@/features/settings/hooks/useOrgSpecialties", () => ({
  useOrgSpecialties: () => ({ data: [] }),
}));
vi.mock("@/features/auth/store/authContextStore", () => ({
  useAuthContextStore: (sel: (s: { organizationId: string }) => unknown) =>
    sel({ organizationId: "org-1" }),
}));
// The drawer is exercised in its own test; stub it here to keep this focused.
vi.mock("./ServiceDrawer", () => ({ ServiceDrawer: () => null }));

import { ServicesSubSection } from "./ServicesSubSection";

function makeService(over: Partial<Service> = {}): Service {
  return {
    id: "svc-1",
    organization_id: "org-1",
    code: "CONSULT-1",
    name: "Consultation",
    description: null,
    service_type: "CONSULTATION",
    is_active: true,
    specialty_ids: [],
    category_id: null,
    category: null,
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z",
    ...over,
  };
}

describe("ServicesSubSection", () => {
  beforeEach(() => {
    useServicesMock.mockReset();
    deleteMutate.mockReset();
    toggleMutate.mockReset();
    useServicesMock.mockReturnValue({ services: [], isLoading: false });
  });

  it("shows the empty state when there are no services", () => {
    renderWithIntl(<ServicesSubSection />);
    expect(screen.getByText(/no services yet/i)).toBeInTheDocument();
  });

  it("renders a service row with its code, name and inactive badge", () => {
    useServicesMock.mockReturnValue({
      services: [makeService({ name: "X-Ray", is_active: false })],
      isLoading: false,
    });

    renderWithIntl(<ServicesSubSection />);

    expect(screen.getByText("CONSULT-1")).toBeInTheDocument();
    expect(screen.getByText("X-Ray")).toBeInTheDocument();
    expect(screen.getByText(/inactive/i)).toBeInTheDocument();
  });

  it("toggles active state via the power button", () => {
    useServicesMock.mockReturnValue({
      services: [makeService({ is_active: true })],
      isLoading: false,
    });

    renderWithIntl(<ServicesSubSection />);
    fireEvent.click(screen.getByRole("button", { name: /toggle active/i }));

    expect(toggleMutate).toHaveBeenCalledWith({ id: "svc-1", active: false });
  });

  it("confirms a delete and calls the delete mutation", () => {
    useServicesMock.mockReturnValue({
      services: [makeService()],
      isLoading: false,
    });

    renderWithIntl(<ServicesSubSection />);
    fireEvent.click(screen.getByRole("button", { name: /delete service/i }));

    // Confirm in the AlertDialog.
    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));
    expect(deleteMutate).toHaveBeenCalledWith("svc-1", expect.any(Object));
  });
});
