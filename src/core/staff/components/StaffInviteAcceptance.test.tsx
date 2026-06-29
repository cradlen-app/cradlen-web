import type { ReactNode } from "react";
import { screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";
import { ApiError } from "@/infrastructure/http/api";
import type { InvitationPreview } from "../types/staff.api.types";

const { searchParamsMock } = vi.hoisted(() => ({
  searchParamsMock: { get: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParamsMock,
}));
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/features/auth/store/authStore", () => ({
  useAuthStore: () => vi.fn(),
}));
vi.mock("@/features/auth/store/availableProfilesStore", () => ({
  useAvailableProfilesStore: () => vi.fn(),
}));
vi.mock("@/features/auth/lib/profile-selection-session", () => ({
  setPendingProfileSelection: vi.fn(),
}));

const { getInvitationPreviewMock } = vi.hoisted(() => ({
  getInvitationPreviewMock: vi.fn(),
}));
vi.mock("../lib/staff.api", () => ({
  getInvitationPreview: (...args: unknown[]) => getInvitationPreviewMock(...args),
  declineStaffInvite: vi.fn(),
  acceptStaffInvite: vi.fn(),
}));

import { StaffInviteAcceptance } from "./StaffInviteAcceptance";

const preview: InvitationPreview = {
  id: "inv-1",
  status: "pending",
  expires_at: "2026-07-01T00:00:00Z",
  email: "amir@example.com",
  first_name: "Amir",
  last_name: "Hassan",
  organization: { id: "org-1", name: "Cradlen Clinic" },
  invited_by: { first_name: "Dr", last_name: "Sara" },
  role: { id: "r1", name: "Staff" },
  branches: [{ id: "b1", name: "Main", city: "Cairo" }],
};

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return renderWithIntl(<StaffInviteAcceptance />, { wrapper });
}

describe("StaffInviteAcceptance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParamsMock.get.mockImplementation((key: string) => {
      if (key === "token") return "tok-1";
      if (key === "invitation") return "inv-1";
      return null;
    });
  });

  it("shows a missing-information error when params are absent", () => {
    searchParamsMock.get.mockReturnValue(null);
    renderPage();
    expect(
      screen.getByText("This invitation link is missing required information."),
    ).toBeInTheDocument();
  });

  it("renders the invitation preview once loaded", async () => {
    getInvitationPreviewMock.mockResolvedValue({ data: preview });
    renderPage();

    await waitFor(() =>
      expect(screen.getByText("Amir Hassan")).toBeInTheDocument(),
    );
    expect(screen.getByText("Cradlen Clinic")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Accept Invitation" }),
    ).toBeInTheDocument();
  });

  it("maps a 410 response to the expired-invitation message", async () => {
    getInvitationPreviewMock.mockRejectedValue(new ApiError(410, "gone"));
    renderPage();

    await waitFor(() =>
      expect(
        screen.getByText("This invitation has expired."),
      ).toBeInTheDocument(),
    );
  });

  it("maps a 409 response to the already-accepted message", async () => {
    getInvitationPreviewMock.mockRejectedValue(new ApiError(409, "conflict"));
    renderPage();

    await waitFor(() =>
      expect(
        screen.getByText("This invitation has already been accepted."),
      ).toBeInTheDocument(),
    );
  });
});
