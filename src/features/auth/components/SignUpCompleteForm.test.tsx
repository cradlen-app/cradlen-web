import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";
import { ApiError } from "@/infrastructure/http/api";
import { SignUpCompleteForm } from "./SignUpCompleteForm";

const mockRouter = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
const mockRegisterOrg = vi.hoisted(() => vi.fn());
const mockSelectProfile = vi.hoisted(() => vi.fn());
const mockResolveAuthRedirect = vi.hoisted(() => vi.fn());
const mockGetProfiles = vi.hoisted(() => vi.fn());
const mockIsOnboardingRedirect = vi.hoisted(() => vi.fn(() => false));
const mockGetProfileBranches = vi.hoisted(() => vi.fn());
const mockResolveDefaultRoute = vi.hoisted(() => vi.fn());
const mockSetPendingProfileSelection = vi.hoisted(() => vi.fn());

vi.mock("@/i18n/navigation", () => ({ useRouter: () => mockRouter }));

vi.mock("@/hooks/useAuthRedirect", () => ({
  useAuthRedirect: () => ({ email: "sara@example.com", isChecking: false }),
}));

vi.mock("@/infrastructure/query/queryClient", () => ({
  queryClient: { clear: vi.fn() },
}));

vi.mock("@/lib/auth/redirect", () => ({
  resolveAuthRedirect: (...args: unknown[]) => mockResolveAuthRedirect(...args),
  getProfilesFromAuthResponse: (...args: unknown[]) => mockGetProfiles(...args),
  isOnboardingRedirectPath: (...args: unknown[]) =>
    mockIsOnboardingRedirect(...args),
}));

vi.mock("../lib/current-user", () => ({
  getProfileBranches: (...args: unknown[]) => mockGetProfileBranches(...args),
  getBranchId: () => "branch-1",
  getProfileId: () => "profile-1",
  getProfileOrganizationId: () => "org-1",
}));

vi.mock("../lib/redirect", () => ({
  resolveDefaultRouteAfterAuth: (...args: unknown[]) =>
    mockResolveDefaultRoute(...args),
}));

vi.mock("../lib/register-organization", () => ({
  buildRegisterOrganizationRequest: () => ({ organization_name: "Clinic" }),
}));

vi.mock("../lib/registration-session", () => ({
  clearPendingSignupSession: vi.fn(),
}));

vi.mock("../lib/profile-selection-session", () => ({
  clearPendingProfileSelection: vi.fn(),
  setPendingProfileSelection: (...args: unknown[]) =>
    mockSetPendingProfileSelection(...args),
}));

vi.mock("../hooks/useSignUp", () => ({
  useRegisterOrganization: () => ({
    isPending: false,
    mutateAsync: mockRegisterOrg,
  }),
}));

vi.mock("../hooks/useSelectProfile", () => ({
  useSelectProfile: () => ({ isPending: false, mutateAsync: mockSelectProfile }),
}));

vi.mock("../store/authStore", () => ({
  useAuthStore: (sel: (s: unknown) => unknown) =>
    sel({ setAuthenticated: vi.fn() }),
}));
vi.mock("../store/authContextStore", () => ({
  useAuthContextStore: (sel: (s: unknown) => unknown) =>
    sel({ setContext: vi.fn() }),
}));
vi.mock("../store/availableProfilesStore", () => ({
  useAvailableProfilesStore: (sel: (s: unknown) => unknown) =>
    sel({ setAvailableProfiles: vi.fn() }),
}));

// Stub the specialties multiselect with a button that injects a value so the
// step-3 schema (specialties min 1) validates without real combobox interaction.
vi.mock("@/components/common/SpecialtiesSelect", () => ({
  SpecialtiesSelect: ({ onChange }: { onChange: (v: string[]) => void }) => (
    <button type="button" onClick={() => onChange(["OBGYN"])}>
      pick-specialty
    </button>
  ),
}));

function fillForm() {
  fireEvent.click(screen.getByText("pick-specialty"));
  const set = (id: string, value: string) =>
    fireEvent.change(document.getElementById(id) as HTMLInputElement, {
      target: { value },
    });
  set("organizationName", "Cradlen Clinic");
  set("branchName", "Main");
  set("city", "Cairo");
  set("governorate", "Cairo");
  set("address", "1 Clinic St");
}

function submit() {
  fireEvent.submit(
    document.getElementById("organizationName")!.closest(
      "form",
    ) as HTMLFormElement,
  );
}

describe("SignUpCompleteForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsOnboardingRedirect.mockReturnValue(false);
  });

  it("auto-selects a single-branch profile and routes to its default page", async () => {
    mockRegisterOrg.mockResolvedValue({ data: { profiles: [{}] } });
    mockResolveAuthRedirect.mockReturnValue("/select-profile");
    mockGetProfiles.mockReturnValue([{ profile_id: "profile-1" }]);
    mockGetProfileBranches.mockReturnValue([{ branch_id: "branch-1" }]);
    mockSelectProfile.mockResolvedValue({
      data: {
        organization_id: "org-1",
        branch_id: "branch-1",
        profile_id: "profile-1",
      },
    });
    mockResolveDefaultRoute.mockResolvedValue("/org-1/branch-1/dashboard");

    renderWithIntl(<SignUpCompleteForm />);
    fillForm();
    submit();

    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith(
        "/org-1/branch-1/dashboard",
      ),
    );
    expect(mockSelectProfile).toHaveBeenCalled();
  });

  it("falls back to the manual select-profile page when auto-select is not possible", async () => {
    mockRegisterOrg.mockResolvedValue({ data: { profiles: [{}] } });
    mockResolveAuthRedirect.mockReturnValue("/select-profile");
    mockGetProfiles.mockReturnValue([{ profile_id: "profile-1" }]);
    // Two branches → canAutoSelect is false.
    mockGetProfileBranches.mockReturnValue([
      { branch_id: "b1" },
      { branch_id: "b2" },
    ]);

    renderWithIntl(<SignUpCompleteForm />);
    fillForm();
    submit();

    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith("/select-profile"),
    );
    expect(mockSetPendingProfileSelection).toHaveBeenCalled();
    expect(mockSelectProfile).not.toHaveBeenCalled();
  });

  it("shows the session-expired error when completion returns 401", async () => {
    mockRegisterOrg.mockRejectedValue(new ApiError(401, "expired"));

    renderWithIntl(<SignUpCompleteForm />);
    fillForm();
    submit();

    expect(
      await screen.findByText("Your registration session has expired."),
    ).toBeInTheDocument();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });
});
