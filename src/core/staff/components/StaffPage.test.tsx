import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";
import type { StaffMember } from "../types/staff.types";

const {
  useUserProfileContextMock,
  usePermissionMock,
  useStaffMock,
  useStaffMemberMock,
  useStaffDirectoryMock,
  useRemoveStaffMock,
  useMediaQueryMock,
} = vi.hoisted(() => ({
  useUserProfileContextMock: vi.fn(),
  usePermissionMock: vi.fn(),
  useStaffMock: vi.fn(),
  useStaffMemberMock: vi.fn(),
  useStaffDirectoryMock: vi.fn(),
  useRemoveStaffMock: vi.fn(),
  useMediaQueryMock: vi.fn(),
}));

vi.mock("@/features/auth/hooks/useUserProfileContext", () => ({
  useUserProfileContext: () => useUserProfileContextMock(),
}));
vi.mock("@/kernel", () => ({
  usePermission: (id: string) => usePermissionMock(id),
}));
vi.mock("../hooks/useStaff", () => ({
  useStaff: (...a: unknown[]) => useStaffMock(...a),
  useStaffMember: (...a: unknown[]) => useStaffMemberMock(...a),
}));
vi.mock("../hooks/useStaffDirectory", () => ({
  useStaffDirectory: (...a: unknown[]) => useStaffDirectoryMock(...a),
}));
vi.mock("../hooks/useManageStaff", () => ({
  useRemoveStaffFromBranch: () => useRemoveStaffMock(),
}));
vi.mock("@/hooks/useMediaQuery", () => ({
  useMediaQuery: () => useMediaQueryMock(),
}));
vi.mock("next/dynamic", () => ({ default: () => () => null }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// Isolate the page from its heavy children — they have their own tests.
vi.mock("./StaffHeader", () => ({ StaffHeader: () => <div data-testid="header" /> }));
vi.mock("./StaffOverview", () => ({ StaffOverview: () => <div data-testid="overview" /> }));
vi.mock("./StaffStatCards", () => ({ StaffStatCards: () => <div data-testid="stats" /> }));
vi.mock("./StaffToolbar", () => ({ StaffToolbar: () => <div data-testid="toolbar" /> }));
vi.mock("./InactiveStaffPanel", () => ({ InactiveStaffPanel: () => <div data-testid="inactive" /> }));
vi.mock("./StaffTable", () => ({
  StaffTable: ({ members }: { members: StaffMember[] }) => (
    <div data-testid="staff-table">{members.length} rows</div>
  ),
}));

import { StaffPage } from "./StaffPage";

const member: StaffMember = {
  id: "staff-1",
  firstName: "Mona",
  lastName: "Amin",
  email: "mona@example.com",
  handle: "@mona",
  phone: "-",
  status: "available",
  role: "STAFF",
  roleId: "role-1",
  roleName: "Staff",
  branches: [],
  jobFunction: null,
  specialty: null,
  subspecialties: [],
  isClinical: false,
};

function setProfile(overrides: Record<string, unknown> = {}) {
  useUserProfileContextMock.mockReturnValue({
    currentUser: { id: "u1" },
    isCurrentUserLoading: false,
    isCurrentUserError: false,
    currentUserStaffId: "staff-x",
    isOwner: true,
    isBranchManager: false,
    organizationId: "org-1",
    organizationName: "Cradlen",
    branchId: "b1",
    branchName: "Main",
    ...overrides,
  });
}

function setStaff({
  data = [member],
  isLoading = false,
  isError = false,
}: Partial<{ data: StaffMember[]; isLoading: boolean; isError: boolean }> = {}) {
  useStaffMock.mockReturnValue({ data, isLoading, isError });
}

describe("StaffPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePermissionMock.mockReturnValue(true);
    setProfile();
    setStaff();
    useStaffMemberMock.mockReturnValue({ data: undefined });
    useRemoveStaffMock.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    useMediaQueryMock.mockReturnValue(true);
    useStaffDirectoryMock.mockReturnValue({
      filteredStaff: [member],
      selectedId: null,
      selectedMember: null,
      setSelectedId: vi.fn(),
      totalStaff: 1,
    });
  });

  it("shows a forbidden notice when the user lacks staff.read", () => {
    usePermissionMock.mockImplementation((id: string) => id !== "staff.read");
    renderWithIntl(<StaffPage />);
    expect(
      screen.getByText("You don't have permission to view staff."),
    ).toBeInTheDocument();
  });

  it("renders a loading skeleton while data loads", () => {
    setProfile({ isCurrentUserLoading: true });
    setStaff({ isLoading: true });
    const { container } = renderWithIntl(<StaffPage />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("surfaces a load error", () => {
    setStaff({ isError: true });
    renderWithIntl(<StaffPage />);
    expect(
      screen.getByText("Failed to load staff. Please try again."),
    ).toBeInTheDocument();
  });

  it("shows a no-branch notice when no branch is linked", () => {
    setProfile({ branchId: undefined, organizationId: undefined });
    renderWithIntl(<StaffPage />);
    expect(
      screen.getByText("No organization or branch is linked to this account."),
    ).toBeInTheDocument();
  });

  it("renders the staff table with the paged members", () => {
    renderWithIntl(<StaffPage />);
    expect(screen.getByTestId("staff-table")).toHaveTextContent("1 rows");
  });
});
