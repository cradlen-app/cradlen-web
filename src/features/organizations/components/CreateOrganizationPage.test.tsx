import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithIntl } from "@/test/render";

const replace = vi.fn();
const createOrganizationSession = vi.fn();
const buildRegisterOrganizationRequest = vi.fn();
const setPendingProfileSelection = vi.fn();
const setAvailableProfiles = vi.fn();
const getProfilesFromAuthResponse = vi.fn();
const getSubscriptionLimit = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace }),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

vi.mock("sonner", () => ({
  toast: { success: (m: string) => toastSuccess(m), error: (m: string) => toastError(m) },
}));

vi.mock("@/components/common/SpecialtiesSelect", () => ({
  SpecialtiesSelect: ({ onChange }: { onChange: (v: string[]) => void }) => (
    <button type="button" onClick={() => onChange(["PED"])}>
      pick-specialty
    </button>
  ),
}));

vi.mock("@/components/common/SubspecialtiesSelect", () => ({
  SubspecialtiesSelect: () => <div data-testid="subspecialties" />,
}));

vi.mock("@/features/settings/hooks/useSettingsLookups", () => ({
  useSpecialtiesLookup: () => ({ data: { data: [] } }),
}));

vi.mock("@/features/auth/store/availableProfilesStore", () => ({
  useAvailableProfilesStore: (selector: (s: unknown) => unknown) =>
    selector({ setAvailableProfiles }),
}));

vi.mock("@/features/settings/lib/settings.api", () => ({
  createOrganizationSession: (...args: unknown[]) => createOrganizationSession(...args),
}));

vi.mock("@/features/auth/lib/register-organization", () => ({
  buildRegisterOrganizationRequest: (...args: unknown[]) =>
    buildRegisterOrganizationRequest(...args),
}));

vi.mock("@/features/auth/lib/profile-selection-session", () => ({
  setPendingProfileSelection: (...args: unknown[]) => setPendingProfileSelection(...args),
}));

vi.mock("@/lib/auth/redirect", () => ({
  getProfilesFromAuthResponse: (...args: unknown[]) => getProfilesFromAuthResponse(...args),
}));

vi.mock("@/common/errors/subscription-errors", () => ({
  getSubscriptionLimit: (...args: unknown[]) => getSubscriptionLimit(...args),
}));

import { CreateOrganizationPage } from "./CreateOrganizationPage";

function fillValidForm() {
  fireEvent.change(screen.getByLabelText(/Organization name/), {
    target: { value: "Cradlen Clinic" },
  });
  fireEvent.click(screen.getByText("pick-specialty"));
  fireEvent.change(screen.getByLabelText(/Branch name/), {
    target: { value: "Main Branch" },
  });
  fireEvent.change(screen.getByLabelText(/City/), {
    target: { value: "Cairo" },
  });
  fireEvent.change(screen.getByLabelText(/Governorate/), {
    target: { value: "Cairo" },
  });
  fireEvent.change(screen.getByLabelText(/Address/), {
    target: { value: "12 Tahrir St" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  buildRegisterOrganizationRequest.mockReturnValue({ request: true });
  getProfilesFromAuthResponse.mockReturnValue([]);
  getSubscriptionLimit.mockReturnValue(undefined);
});

describe("CreateOrganizationPage", () => {
  it("renders the title and the three field groups", () => {
    renderWithIntl(<CreateOrganizationPage />);
    expect(
      screen.getByRole("heading", { name: "Add new organization" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Organization details")).toBeInTheDocument();
    expect(screen.getByText("Your role")).toBeInTheDocument();
    expect(screen.getByText("Main branch")).toBeInTheDocument();
  });

  it("disables the submit button until the form is valid", () => {
    renderWithIntl(<CreateOrganizationPage />);
    expect(
      screen.getByRole("button", { name: "Create organization" }),
    ).toBeDisabled();
  });

  it("enables submit and creates the organization with the built request", async () => {
    createOrganizationSession.mockResolvedValue({ ok: true });
    renderWithIntl(<CreateOrganizationPage />);
    fillValidForm();

    const submit = screen.getByRole("button", { name: "Create organization" });
    await waitFor(() => expect(submit).toBeEnabled());

    fireEvent.click(submit);

    await waitFor(() =>
      expect(createOrganizationSession).toHaveBeenCalledWith({ request: true }),
    );
    expect(buildRegisterOrganizationRequest).toHaveBeenCalledWith(
      expect.objectContaining({ organizationName: "Cradlen Clinic" }),
    );
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith(
        "Organization created. Please select your new profile.",
      ),
    );
    expect(replace).toHaveBeenCalledWith("/select-profile");
  });

  it("shows the org-limit error toast when the plan limit is reached", async () => {
    const error = new Error("limit");
    createOrganizationSession.mockRejectedValue(error);
    getSubscriptionLimit.mockReturnValue({
      resource: "organizations",
      current: 3,
      limit: 3,
    });
    renderWithIntl(<CreateOrganizationPage />);
    fillValidForm();

    const submit = screen.getByRole("button", { name: "Create organization" });
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(expect.stringContaining("3/3")),
    );
    expect(replace).not.toHaveBeenCalled();
  });

  it("shows a generic error toast for non-limit failures", async () => {
    createOrganizationSession.mockRejectedValue(new Error("boom"));
    getSubscriptionLimit.mockReturnValue(undefined);
    renderWithIntl(<CreateOrganizationPage />);
    fillValidForm();

    const submit = screen.getByRole("button", { name: "Create organization" });
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        "Failed to create organization. Please try again.",
      ),
    );
  });
});
