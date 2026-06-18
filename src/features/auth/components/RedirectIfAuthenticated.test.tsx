import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { CurrentUser, UserProfile } from "@/common/types/user.types";
import { RedirectIfAuthenticated } from "./RedirectIfAuthenticated";

const mockRouter = vi.hoisted(() => ({ replace: vi.fn() }));
const mockCurrentUser = vi.hoisted(
  () => ({ value: undefined as { data?: CurrentUser; isLoading: boolean } | undefined }),
);
const mockContext = vi.hoisted(() => ({
  state: {
    organizationId: null as string | null,
    branchId: null as string | null,
    profileId: null as string | null,
  },
}));
const mockSetPendingProfileSelection = vi.hoisted(() => vi.fn());

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => mockRouter,
}));

vi.mock("../hooks/useCurrentUser", () => ({
  useCurrentUser: () => mockCurrentUser.value,
}));

vi.mock("../store/authContextStore", () => {
  const useAuthContextStore = (selector: (s: typeof mockContext.state) => unknown) =>
    selector(mockContext.state);
  useAuthContextStore.getState = () => mockContext.state;
  return { useAuthContextStore };
});

vi.mock("../lib/profile-selection-session", () => ({
  setPendingProfileSelection: mockSetPendingProfileSelection,
}));

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    profile_id: "profile-1",
    role: "owner",
    organization: { id: "org-1", name: "Org" },
    branches: [{ branch_id: "branch-1", is_main: true }],
    ...overrides,
  } as UserProfile;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCurrentUser.value = { data: undefined, isLoading: false };
  mockContext.state = { organizationId: null, branchId: null, profileId: null };
});

describe("RedirectIfAuthenticated", () => {
  it("does nothing for an anonymous visitor", async () => {
    mockCurrentUser.value = { data: undefined, isLoading: false };

    render(<RedirectIfAuthenticated />);

    await waitFor(() => {
      expect(mockRouter.replace).not.toHaveBeenCalled();
    });
  });

  it("does nothing while the session is still loading", async () => {
    mockCurrentUser.value = { data: undefined, isLoading: true };

    render(<RedirectIfAuthenticated />);

    await waitFor(() => {
      expect(mockRouter.replace).not.toHaveBeenCalled();
    });
  });

  it("redirects to the saved workspace when one exists", async () => {
    mockContext.state = {
      organizationId: "org-1",
      branchId: "branch-1",
      profileId: "profile-1",
    };
    mockCurrentUser.value = {
      data: { id: "u1", email: "a@b.com", profiles: [makeProfile()] } as CurrentUser,
      isLoading: false,
    };

    render(<RedirectIfAuthenticated />);

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith(
        expect.stringContaining("/org-1/branch-1/dashboard"),
      );
    });
  });

  it("derives the destination for a single profile with a single branch", async () => {
    mockCurrentUser.value = {
      data: { id: "u1", email: "a@b.com", profiles: [makeProfile()] } as CurrentUser,
      isLoading: false,
    };

    render(<RedirectIfAuthenticated />);

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith(
        expect.stringContaining("/org-1/branch-1/dashboard"),
      );
    });
  });

  it("sends ambiguous multi-profile users to select-profile", async () => {
    mockCurrentUser.value = {
      data: {
        id: "u1",
        email: "a@b.com",
        profiles: [
          makeProfile({ profile_id: "profile-1" }),
          makeProfile({
            profile_id: "profile-2",
            organization: { id: "org-2", name: "Org 2", status: "active" },
          }),
        ],
      } as CurrentUser,
      isLoading: false,
    };

    render(<RedirectIfAuthenticated />);

    await waitFor(() => {
      expect(mockSetPendingProfileSelection).toHaveBeenCalled();
      expect(mockRouter.replace).toHaveBeenCalledWith("/select-profile");
    });
  });
});
