import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";
import { STAFF_API_ROLE } from "@/features/auth/lib/auth.constants";
import type { StaffMember } from "../types/staff.types";

const { useStaffMock, useReactivateStaffMock } = vi.hoisted(() => ({
  useStaffMock: vi.fn(),
  useReactivateStaffMock: vi.fn(),
}));

vi.mock("../hooks/useStaff", () => ({
  useStaff: (...args: unknown[]) => useStaffMock(...args),
}));
vi.mock("../hooks/useManageStaff", () => ({
  useReactivateStaff: () => useReactivateStaffMock(),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { InactiveStaffPanel } from "./InactiveStaffPanel";

const mutate = vi.fn();

function member(overrides: Partial<StaffMember> = {}): StaffMember {
  return {
    id: "staff-1",
    firstName: "Mona",
    lastName: "Amin",
    email: "mona@example.com",
    handle: "@mona",
    phone: "-",
    status: "notAvailable",
    role: STAFF_API_ROLE.STAFF,
    roleId: "role-1",
    roleName: "Staff",
    branches: [],
    jobFunction: null,
    specialty: null,
    subspecialties: [],
    isClinical: false,
    ...overrides,
  };
}

describe("InactiveStaffPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useReactivateStaffMock.mockReturnValue({ mutate, isPending: false });
  });

  it("renders nothing while loading", () => {
    useStaffMock.mockReturnValue({ data: [], isLoading: true });
    const { container } = renderWithIntl(
      <InactiveStaffPanel organizationId="o1" branchId="b1" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when there are no deactivated members", () => {
    useStaffMock.mockReturnValue({ data: [], isLoading: false });
    const { container } = renderWithIntl(
      <InactiveStaffPanel organizationId="o1" branchId="b1" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("lists deactivated members and reactivates one on click", () => {
    useStaffMock.mockReturnValue({ data: [member()], isLoading: false });
    renderWithIntl(<InactiveStaffPanel organizationId="o1" branchId="b1" />);

    expect(screen.getByText("Deactivated members")).toBeInTheDocument();
    expect(screen.getByText("Mona Amin")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Reactivate/i }));
    expect(mutate).toHaveBeenCalledWith(
      { organizationId: "o1", branchId: "b1", staffId: "staff-1" },
      expect.any(Object),
    );
  });

  it("queries staff with the inactive status filter", () => {
    useStaffMock.mockReturnValue({ data: [], isLoading: false });
    renderWithIntl(<InactiveStaffPanel organizationId="o1" branchId="b1" />);
    expect(useStaffMock).toHaveBeenCalledWith("o1", "b1", { status: "inactive" });
  });
});
