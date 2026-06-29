import type { ReactNode } from "react";
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";
import type { ApiStaffInvitation } from "../types/staff.api.types";

const {
  useCurrentUserMock,
  useStaffInvitationsMock,
  useStaffInvitationMock,
  useResendMock,
  useDeleteMock,
  getActiveProfileMock,
  getDefaultBranchMock,
} = vi.hoisted(() => ({
  useCurrentUserMock: vi.fn(),
  useStaffInvitationsMock: vi.fn(),
  useStaffInvitationMock: vi.fn(),
  useResendMock: vi.fn(),
  useDeleteMock: vi.fn(),
  getActiveProfileMock: vi.fn(),
  getDefaultBranchMock: vi.fn(),
}));

vi.mock("@/features/auth/hooks/useCurrentUser", () => ({
  useCurrentUser: () => useCurrentUserMock(),
}));
vi.mock("@/features/auth/lib/current-user", () => ({
  getActiveProfile: (...a: unknown[]) => getActiveProfileMock(...a),
  getDefaultBranch: (...a: unknown[]) => getDefaultBranchMock(...a),
}));
vi.mock("../hooks/useStaffInvitations", () => ({
  useStaffInvitations: () => useStaffInvitationsMock(),
  useStaffInvitation: () => useStaffInvitationMock(),
  useResendStaffInvitation: () => useResendMock(),
  useDeleteStaffInvitation: () => useDeleteMock(),
}));
vi.mock("@/hooks/useDashboardPath", () => ({
  useDashboardPath: () => (p: string) => p,
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { StaffInvitationsPage } from "./StaffInvitationsPage";

const invitation: ApiStaffInvitation = {
  id: "inv-1",
  email: "amir@example.com",
  first_name: "Amir",
  last_name: "Hassan",
  status: "pending",
  role: { id: "r1", name: "STAFF" },
};

function setHooks({
  isCurrentUserLoading = false,
  isCurrentUserError = false,
  hasBranch = true,
  invitationsLoading = false,
  invitationsError = false,
  invitations = [invitation],
}: Partial<{
  isCurrentUserLoading: boolean;
  isCurrentUserError: boolean;
  hasBranch: boolean;
  invitationsLoading: boolean;
  invitationsError: boolean;
  invitations: ApiStaffInvitation[];
}> = {}) {
  useCurrentUserMock.mockReturnValue({
    data: isCurrentUserLoading ? undefined : { id: "u1" },
    isLoading: isCurrentUserLoading,
    isError: isCurrentUserError,
  });
  getActiveProfileMock.mockReturnValue({ organization: { id: "org-1" } });
  getDefaultBranchMock.mockReturnValue(hasBranch ? { id: "b1" } : undefined);
  useStaffInvitationsMock.mockReturnValue({
    data: { data: invitations },
    isLoading: invitationsLoading,
    isError: invitationsError,
  });
  useStaffInvitationMock.mockReturnValue({ data: undefined, isPending: false });
  useResendMock.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
  useDeleteMock.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
}

describe("StaffInvitationsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a loading skeleton while current user / invitations load", () => {
    setHooks({ isCurrentUserLoading: true });
    const { container } = renderWithIntl(<StaffInvitationsPage />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("surfaces a load error", () => {
    setHooks({ invitationsError: true });
    renderWithIntl(<StaffInvitationsPage />);
    expect(
      screen.getByText("Failed to load invitations. Please try again."),
    ).toBeInTheDocument();
  });

  it("shows a no-branch notice when the account has no branch", () => {
    setHooks({ hasBranch: false });
    renderWithIntl(<StaffInvitationsPage />);
    expect(
      screen.getByText("No organization or branch is linked to this account."),
    ).toBeInTheDocument();
  });

  it("renders the invitations table and the status filter tabs", () => {
    setHooks();
    renderWithIntl(<StaffInvitationsPage />);

    expect(screen.getByText("Amir Hassan")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Pending" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Cancelled" })).toBeInTheDocument();
  });

  it("shows an empty result message when nothing matches", () => {
    setHooks({ invitations: [] });
    renderWithIntl(<StaffInvitationsPage />);
    expect(
      screen.getByText("No invitations match your filters."),
    ).toBeInTheDocument();
  });
});
