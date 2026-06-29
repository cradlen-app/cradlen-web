import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";
import type { UserProfile } from "@/common/types/user.types";
import { toast } from "sonner";
import { SelectProfilePage } from "./SelectProfilePage";

const mockRouter = vi.hoisted(() => ({ replace: vi.fn() }));
const mockSelectProfile = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  isPending: false,
}));
const mockSession = vi.hoisted(() => ({
  pending: null as { profiles: UserProfile[] } | null,
}));
const mockClearPending = vi.hoisted(() => vi.fn());
const mockResolveRoute = vi.hoisted(() =>
  vi.fn(async () => "/org-1/branch-1/dashboard/overview"),
);

// ApiError dual-path mock so `error instanceof ApiError` holds on both module paths.
const { MockApiError } = vi.hoisted(() => {
  class MockApiError extends Error {
    public messages: string[];
    constructor(
      public status: number,
      message: string | string[],
      public body?: unknown,
    ) {
      const messages = Array.isArray(message) ? message : [message];
      super(messages.join("\n"));
      this.messages = messages;
    }
  }
  return { MockApiError };
});

vi.mock("@/common/errors/api-error", () => ({ ApiError: MockApiError }));
vi.mock("@/infrastructure/http/api", () => ({
  apiFetch: vi.fn(),
  apiAuthFetch: vi.fn(),
  ApiError: MockApiError,
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(""),
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => mockRouter,
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

vi.mock("@/infrastructure/query/queryClient", () => ({
  queryClient: { clear: vi.fn() },
}));

vi.mock("../hooks/useSelectProfile", () => ({
  useSelectProfile: () => mockSelectProfile,
}));

vi.mock("../lib/profile-selection-session", () => ({
  getPendingProfileSelection: () => mockSession.pending,
  clearPendingProfileSelection: mockClearPending,
}));

vi.mock("../lib/redirect", async () => {
  const actual = await vi.importActual<typeof import("../lib/redirect")>(
    "../lib/redirect",
  );
  return { ...actual, resolveDefaultRouteAfterAuth: mockResolveRoute };
});

vi.mock("../store/availableProfilesStore", () => ({
  getValidAvailableProfiles: () => [],
  useAvailableProfilesStore: { getState: () => ({}) },
}));

vi.mock("../store/authStore", () => ({
  useAuthStore: (sel: (s: Record<string, unknown>) => unknown) =>
    sel({ setAuthenticated: vi.fn(), clearSession: vi.fn() }),
}));

vi.mock("../store/authContextStore", () => ({
  useAuthContextStore: (sel: (s: Record<string, unknown>) => unknown) =>
    sel({ setContext: vi.fn(), clearContext: vi.fn() }),
}));

vi.mock("../store/userStore", () => ({
  useUserStore: (sel: (s: Record<string, unknown>) => unknown) =>
    sel({ clearUser: vi.fn() }),
}));

function makeProfile(overrides: Record<string, unknown> = {}): UserProfile {
  return {
    profile_id: "profile-1",
    role: "owner",
    organization: { id: "org-1", name: "Cradlen Clinic" },
    branches: [{ branch_id: "branch-1", is_main: true, name: "Main" }],
    ...overrides,
  } as UserProfile;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSession.pending = null;
  mockSelectProfile.isPending = false;
  mockSelectProfile.mutateAsync.mockResolvedValue({
    data: {
      organization_id: "org-1",
      branch_id: "branch-1",
      profile_id: "profile-1",
    },
  });
});

describe("SelectProfilePage", () => {
  it("shows the empty state with a back-to-sign-in action when no profiles exist", async () => {
    mockSession.pending = { profiles: [] };

    renderWithIntl(<SelectProfilePage />);

    await waitFor(() =>
      expect(
        screen.getByText("No profiles are available for this sign-in."),
      ).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: "Back to sign in" }));
    expect(mockRouter.replace).toHaveBeenCalledWith("/sign-in");
  });

  it("renders a profile card per profile when multiple profiles are present", async () => {
    mockSession.pending = {
      profiles: [
        makeProfile({ profile_id: "profile-1" }),
        makeProfile({
          profile_id: "profile-2",
          organization: { id: "org-2", name: "Second Clinic" },
        }),
      ],
    };

    renderWithIntl(<SelectProfilePage />);

    await waitFor(() =>
      expect(screen.getByText("Cradlen Clinic")).toBeInTheDocument(),
    );
    expect(screen.getByText("Second Clinic")).toBeInTheDocument();
    // No auto-selection: Continue stays disabled until a card is chosen.
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("selects a profile and submits the selection payload, then redirects", async () => {
    mockSession.pending = {
      profiles: [
        makeProfile({ profile_id: "profile-1" }),
        makeProfile({
          profile_id: "profile-2",
          organization: { id: "org-2", name: "Second Clinic" },
        }),
      ],
    };

    renderWithIntl(<SelectProfilePage />);

    await waitFor(() =>
      expect(screen.getByText("Cradlen Clinic")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByText("Cradlen Clinic"));
    const continueBtn = screen.getByRole("button", { name: "Continue" });
    await waitFor(() => expect(continueBtn).not.toBeDisabled());
    fireEvent.click(continueBtn);

    await waitFor(() =>
      expect(mockSelectProfile.mutateAsync).toHaveBeenCalledWith({
        profile_id: "profile-1",
        organization_id: "org-1",
      }),
    );
    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith(
        "/org-1/branch-1/dashboard/overview",
      ),
    );
  });

  it("auto-proceeds for a single profile with a single branch", async () => {
    mockSession.pending = { profiles: [makeProfile()] };

    renderWithIntl(<SelectProfilePage />);

    await waitFor(() =>
      expect(screen.getByText("Signing you in...")).toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(mockSelectProfile.mutateAsync).toHaveBeenCalledTimes(1),
    );
  });

  it("renders branch selection for a single profile with multiple branches", async () => {
    mockSession.pending = {
      profiles: [
        makeProfile({
          branches: [
            { branch_id: "branch-1", is_main: true, name: "Main" },
            { branch_id: "branch-2", is_main: false, name: "Maadi" },
          ],
        }),
      ],
    };

    renderWithIntl(<SelectProfilePage />);

    await waitFor(() =>
      expect(screen.getByText("Select your branch")).toBeInTheDocument(),
    );
    expect(screen.getByText("Main")).toBeInTheDocument();
    expect(screen.getByText("Maadi")).toBeInTheDocument();

    // Continue is gated until a branch is picked.
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    fireEvent.click(screen.getAllByRole("radio")[1]);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Continue" })).not.toBeDisabled(),
    );
  });

  it("includes branch_id in the payload when the profile has multiple branches", async () => {
    mockSession.pending = {
      profiles: [
        makeProfile({
          branches: [
            { branch_id: "branch-1", is_main: true, name: "Main" },
            { branch_id: "branch-2", is_main: false, name: "Maadi" },
          ],
        }),
      ],
    };

    renderWithIntl(<SelectProfilePage />);

    await waitFor(() =>
      expect(screen.getByText("Select your branch")).toBeInTheDocument(),
    );
    fireEvent.click(screen.getAllByRole("radio")[1]);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() =>
      expect(mockSelectProfile.mutateAsync).toHaveBeenCalledWith({
        profile_id: "profile-1",
        organization_id: "org-1",
        branch_id: "branch-2",
      }),
    );
  });

  it("shows the profile-unavailable toast on a 403 from the backend", async () => {
    mockSession.pending = { profiles: [makeProfile()] };
    mockSelectProfile.mutateAsync.mockRejectedValueOnce(
      new MockApiError(403, "Forbidden"),
    );

    renderWithIntl(<SelectProfilePage />);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "This profile or branch is no longer available. Please pick another.",
      ),
    );
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("expires the session and redirects to sign-in on a 401", async () => {
    mockSession.pending = { profiles: [makeProfile()] };
    mockSelectProfile.mutateAsync.mockRejectedValueOnce(
      new MockApiError(401, "Unauthorized"),
    );

    renderWithIntl(<SelectProfilePage />);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Your profile selection session expired. Please sign in again.",
      ),
    );
    expect(mockClearPending).toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith("/sign-in");
  });

  it("shows a generic error toast on an unexpected failure", async () => {
    mockSession.pending = { profiles: [makeProfile()] };
    mockSelectProfile.mutateAsync.mockRejectedValueOnce(new Error("boom"));

    renderWithIntl(<SelectProfilePage />);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Could not select this profile. Please try again.",
      ),
    );
  });
});
