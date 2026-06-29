import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";
import type { StaffRoleOption } from "../types/staff.types";

const {
  useUserProfileContextMock,
  usePermissionMock,
  inviteMutateAsync,
  createMutateAsync,
  updateMutateAsync,
  useInviteStaffMock,
  useCreateStaffDirectMock,
  useUpdateStaffMock,
  useStaffRolesMock,
  useSpecialtiesMock,
  useOrgBranchesMock,
  toastErrorMock,
  toastSuccessMock,
} = vi.hoisted(() => ({
  useUserProfileContextMock: vi.fn(),
  usePermissionMock: vi.fn(),
  inviteMutateAsync: vi.fn(),
  createMutateAsync: vi.fn(),
  updateMutateAsync: vi.fn(),
  useInviteStaffMock: vi.fn(),
  useCreateStaffDirectMock: vi.fn(),
  useUpdateStaffMock: vi.fn(),
  useStaffRolesMock: vi.fn(),
  useSpecialtiesMock: vi.fn(),
  useOrgBranchesMock: vi.fn(),
  toastErrorMock: vi.fn(),
  toastSuccessMock: vi.fn(),
}));

vi.mock("@/features/auth/hooks/useUserProfileContext", () => ({
  useUserProfileContext: () => useUserProfileContextMock(),
}));
vi.mock("@/kernel", () => ({
  usePermission: (id: string) => usePermissionMock(id),
}));
vi.mock("../hooks/useInviteStaff", () => ({
  useInviteStaff: () => useInviteStaffMock(),
}));
vi.mock("../hooks/useCreateStaffDirect", () => ({
  useCreateStaffDirect: () => useCreateStaffDirectMock(),
}));
vi.mock("../hooks/useManageStaff", () => ({
  useUpdateStaff: () => useUpdateStaffMock(),
}));
vi.mock("../hooks/useStaffRoles", () => ({
  useStaffRoles: () => useStaffRolesMock(),
}));
vi.mock("../hooks/useStaffLookups", () => ({
  useSpecialties: () => useSpecialtiesMock(),
  useOrgBranches: () => useOrgBranchesMock(),
}));
vi.mock("sonner", () => ({
  toast: { error: toastErrorMock, success: toastSuccessMock },
}));

import { StaffCreateDrawer } from "./StaffCreateDrawer";

const ROLES: StaffRoleOption[] = [
  { id: "role-owner", name: "OWNER", role: "OWNER" },
  { id: "role-bm", name: "BRANCH_MANAGER", role: "BRANCH_MANAGER" },
  { id: "role-staff", name: "STAFF", role: "STAFF" },
];

function renderDrawer(props: Partial<Parameters<typeof StaffCreateDrawer>[0]> = {}) {
  renderWithIntl(
    <StaffCreateDrawer
      open
      onOpenChange={vi.fn()}
      organizationId="org-1"
      organizationName="Cradlen Clinic"
      branchId="b1"
      method="invite"
      {...props}
    />,
  );
}

describe("StaffCreateDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUserProfileContextMock.mockReturnValue({
      activeProfile: { branches: [{ id: "b1" }] },
      isOwner: true,
    });
    usePermissionMock.mockReturnValue(true); // staff.editRoles
    inviteMutateAsync.mockResolvedValue({ data: { id: "inv-1" } });
    createMutateAsync.mockResolvedValue({
      data: { generated_email: "x@clinic.com" },
    });
    updateMutateAsync.mockResolvedValue({});
    useInviteStaffMock.mockReturnValue({
      mutateAsync: inviteMutateAsync,
      isPending: false,
    });
    useCreateStaffDirectMock.mockReturnValue({
      mutateAsync: createMutateAsync,
      isPending: false,
    });
    useUpdateStaffMock.mockReturnValue({
      mutateAsync: updateMutateAsync,
      isPending: false,
    });
    useStaffRolesMock.mockReturnValue({ data: ROLES });
    useSpecialtiesMock.mockReturnValue({ data: [] });
    useOrgBranchesMock.mockReturnValue({
      data: { data: [{ id: "b1", name: "Main", city: "Cairo" }] },
    });
  });

  it("renders the invite drawer title and the organization name", () => {
    renderDrawer();
    expect(screen.getByText("Staff / New Staff")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Cradlen Clinic")).toBeInTheDocument();
  });

  it("offers only the assignable Staff role for a non-owner caller", () => {
    useUserProfileContextMock.mockReturnValue({
      activeProfile: { branches: [{ id: "b1" }] },
      isOwner: false,
    });
    usePermissionMock.mockReturnValue(false);
    renderDrawer();

    expect(screen.getByRole("button", { name: "Staff" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Owner" })).not.toBeInTheDocument();
  });

  it("submits an invite payload with the split first/last name and branch id", async () => {
    renderDrawer();

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Mona Amin" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "mona@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Staff" }));
    fireEvent.click(screen.getByRole("button", { name: "Send Invite" }));

    await waitFor(() => expect(inviteMutateAsync).toHaveBeenCalledTimes(1));
    expect(inviteMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org-1",
        branchId: "b1",
        data: expect.objectContaining({
          email: "mona@example.com",
          first_name: "Mona",
          last_name: "Amin",
          role_id: "role-staff",
          branch_ids: expect.arrayContaining(["b1"]),
        }),
      }),
    );
  });

  it("blocks submission and flags review when required fields are missing", async () => {
    renderDrawer();
    fireEvent.click(screen.getByRole("button", { name: "Send Invite" }));

    await waitFor(() =>
      expect(
        screen.getByText("Please review the highlighted fields."),
      ).toBeInTheDocument(),
    );
    expect(inviteMutateAsync).not.toHaveBeenCalled();
  });
});
