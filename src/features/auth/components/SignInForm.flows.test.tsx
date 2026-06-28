import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";

type Profile = {
  profile_id: string;
  org_id: string;
  branches: { id: string }[];
};

const h = vi.hoisted(() => ({
  replace: vi.fn(),
  signIn: vi.fn(),
  selectProfile: vi.fn(),
  setAuthenticated: vi.fn(),
  setContext: vi.fn(),
  setAvailableProfiles: vi.fn(),
  setPendingProfileSelection: vi.fn(),
  setPendingSignupEmail: vi.fn(),
  clearPendingProfileSelection: vi.fn(),
  queryClear: vi.fn(),
  resolveDefaultRoute: vi.fn(),
  flow: {
    nextPath: "/select-profile",
    profiles: [] as Profile[],
    isError: false,
    error: null as unknown,
    notice: null as string | null,
  },
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => {
    const p = new URLSearchParams();
    if (h.flow.notice) p.set("notice", h.flow.notice);
    return p;
  },
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: React.ComponentProps<"a">) => (
    <a href={String(href)} {...props}>
      {children}
    </a>
  ),
  useRouter: () => ({ replace: h.replace }),
}));
vi.mock("../hooks/useSignIn", () => ({
  useSignIn: () => ({
    mutateAsync: h.signIn,
    isError: h.flow.isError,
    error: h.flow.error,
  }),
}));
vi.mock("../hooks/useSelectProfile", () => ({
  useSelectProfile: () => ({ mutateAsync: h.selectProfile }),
}));
vi.mock("@/lib/auth/redirect", () => ({
  resolveAuthRedirect: () => h.flow.nextPath,
  isOnboardingRedirectPath: (p: string) => p === "/sign-up",
  getProfilesFromAuthResponse: () => h.flow.profiles,
}));
vi.mock("../lib/redirect", () => ({
  getSafeRedirectPath: () => null,
  resolveDefaultRouteAfterAuth: (...a: unknown[]) => h.resolveDefaultRoute(...a),
}));
vi.mock("../lib/profile-selection-session", () => ({
  setPendingProfileSelection: (...a: unknown[]) => h.setPendingProfileSelection(...a),
  clearPendingProfileSelection: () => h.clearPendingProfileSelection(),
}));
vi.mock("../lib/registration-session", () => ({
  setPendingSignupEmail: (...a: unknown[]) => h.setPendingSignupEmail(...a),
}));
vi.mock("../lib/current-user", () => ({
  getProfileBranches: (p: Profile) => p.branches,
  getProfileId: (p: Profile) => p.profile_id,
  getProfileOrganizationId: (p: Profile) => p.org_id,
  getBranchId: (b: { id: string }) => b.id,
}));
vi.mock("../store/authStore", () => ({
  useAuthStore: (sel: (s: { setAuthenticated: () => void }) => unknown) =>
    sel({ setAuthenticated: h.setAuthenticated }),
}));
vi.mock("../store/authContextStore", () => ({
  useAuthContextStore: (sel: (s: { setContext: () => void }) => unknown) =>
    sel({ setContext: h.setContext }),
}));
vi.mock("../store/availableProfilesStore", () => ({
  useAvailableProfilesStore: (
    sel: (s: { setAvailableProfiles: () => void }) => unknown,
  ) => sel({ setAvailableProfiles: h.setAvailableProfiles }),
}));
vi.mock("@/infrastructure/query/queryClient", () => ({
  queryClient: { clear: () => h.queryClear() },
}));

import { SignInForm } from "./SignInForm";

function submit() {
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "person@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "Password1!" },
  });
  fireEvent.submit(screen.getByRole("button", { name: "Sign in" }));
}

describe("SignInForm flows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.flow.nextPath = "/select-profile";
    h.flow.profiles = [];
    h.flow.isError = false;
    h.flow.error = null;
    h.flow.notice = null;
    h.signIn.mockResolvedValue({ data: {} });
    h.resolveDefaultRoute.mockResolvedValue("/org-1/branch-1/dashboard");
  });

  it("routes multi-profile sign-ins to the select-profile page", async () => {
    h.flow.profiles = [
      { profile_id: "p1", org_id: "o1", branches: [{ id: "b1" }] },
      { profile_id: "p2", org_id: "o2", branches: [{ id: "b2" }] },
    ];
    renderWithIntl(<SignInForm />);
    submit();
    await waitFor(() =>
      expect(h.replace).toHaveBeenCalledWith("/select-profile"),
    );
    expect(h.setAvailableProfiles).toHaveBeenCalled();
    expect(h.setPendingProfileSelection).toHaveBeenCalled();
    // The single-branch fast path must NOT run for multi-profile users.
    expect(h.selectProfile).not.toHaveBeenCalled();
  });

  it("takes the single-profile single-branch fast path straight to the dashboard", async () => {
    h.flow.profiles = [{ profile_id: "p1", org_id: "o1", branches: [{ id: "b1" }] }];
    h.selectProfile.mockResolvedValue({
      data: { organization_id: "o1", branch_id: "b1", profile_id: "p1" },
    });
    renderWithIntl(<SignInForm />);
    submit();
    await waitFor(() =>
      expect(h.replace).toHaveBeenCalledWith("/org-1/branch-1/dashboard"),
    );
    expect(h.setAuthenticated).toHaveBeenCalled();
    expect(h.setContext).toHaveBeenCalledWith({
      organizationId: "o1",
      branchId: "b1",
      profileId: "p1",
    });
    expect(h.queryClear).toHaveBeenCalled();
  });

  it("falls back to /select-profile when the fast-path selection throws", async () => {
    h.flow.profiles = [{ profile_id: "p1", org_id: "o1", branches: [{ id: "b1" }] }];
    h.selectProfile.mockRejectedValue(new Error("nope"));
    renderWithIntl(<SignInForm />);
    submit();
    await waitFor(() =>
      expect(h.replace).toHaveBeenCalledWith("/select-profile"),
    );
    expect(h.setAuthenticated).not.toHaveBeenCalled();
  });

  it("resumes onboarding at the start step with the email pre-filled", async () => {
    h.flow.nextPath = "/sign-up";
    renderWithIntl(<SignInForm />);
    submit();
    await waitFor(() =>
      expect(h.replace).toHaveBeenCalledWith(
        "/sign-up?resume=1&email=person%40example.com",
      ),
    );
  });

  it("renders the organization-exists notice banner from the query string", () => {
    h.flow.notice = "organization-exists";
    renderWithIntl(<SignInForm />);
    expect(
      screen.getByText("You already have an account. Please sign in below."),
    ).toBeInTheDocument();
  });

  it("toggles password visibility", () => {
    renderWithIntl(<SignInForm />);
    const pwd = screen.getByLabelText("Password") as HTMLInputElement;
    expect(pwd.type).toBe("password");
    fireEvent.click(screen.getByRole("button", { name: /Show/i }));
    expect(pwd.type).toBe("text");
  });
});
