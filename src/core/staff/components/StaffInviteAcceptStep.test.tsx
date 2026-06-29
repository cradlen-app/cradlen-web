import type { ReactNode } from "react";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";
import { ApiError } from "@/infrastructure/http/api";
import type { InvitationPreview } from "../types/staff.api.types";

const { routerReplaceMock } = vi.hoisted(() => ({
  routerReplaceMock: vi.fn(),
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace: routerReplaceMock, push: vi.fn() }),
}));

const { toastSuccessMock, toastErrorMock } = vi.hoisted(() => ({
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));
vi.mock("sonner", () => ({
  toast: { success: toastSuccessMock, error: toastErrorMock },
}));

const { setAuthenticatedMock, setAvailableProfilesMock } = vi.hoisted(() => ({
  setAuthenticatedMock: vi.fn(),
  setAvailableProfilesMock: vi.fn(),
}));
vi.mock("@/features/auth/store/authStore", () => ({
  useAuthStore: () => setAuthenticatedMock,
}));
vi.mock("@/features/auth/store/availableProfilesStore", () => ({
  useAvailableProfilesStore: () => setAvailableProfilesMock,
}));

const { setPendingProfileSelectionMock } = vi.hoisted(() => ({
  setPendingProfileSelectionMock: vi.fn(),
}));
vi.mock("@/features/auth/lib/profile-selection-session", () => ({
  setPendingProfileSelection: setPendingProfileSelectionMock,
}));

const { apiAuthFetchMock } = vi.hoisted(() => ({
  apiAuthFetchMock: vi.fn(),
}));
vi.mock("@/infrastructure/http/api", async () => {
  const actual =
    await vi.importActual<typeof import("@/infrastructure/http/api")>(
      "@/infrastructure/http/api",
    );
  return {
    ...actual,
    apiAuthFetch: (...args: unknown[]) => apiAuthFetchMock(...args),
  };
});

const { acceptStaffInviteMock } = vi.hoisted(() => ({
  acceptStaffInviteMock: vi.fn(),
}));
vi.mock("../lib/staff.api", () => ({
  acceptStaffInvite: (...args: unknown[]) => acceptStaffInviteMock(...args),
}));

const {
  getActiveProfileMock,
  getBranchIdMock,
  getDefaultBranchMock,
} = vi.hoisted(() => ({
  getActiveProfileMock: vi.fn(),
  getBranchIdMock: vi.fn(),
  getDefaultBranchMock: vi.fn(),
}));
vi.mock("@/features/auth/lib/current-user", () => ({
  getActiveProfile: (...args: unknown[]) => getActiveProfileMock(...args),
  getBranchId: (...args: unknown[]) => getBranchIdMock(...args),
  getDefaultBranch: (...args: unknown[]) => getDefaultBranchMock(...args),
}));

import { AcceptStep } from "./StaffInviteAcceptStep";

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

const onBack = vi.fn();

function renderStep(p: InvitationPreview = preview) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return renderWithIntl(
    <AcceptStep
      preview={p}
      token="tok-1"
      invitationId="inv-1"
      onBack={onBack}
    />,
    { wrapper },
  );
}

async function fillValidPassword(user: ReturnType<typeof userEvent.setup>) {
  const pw = screen.getByPlaceholderText("Create password");
  const confirm = screen.getByPlaceholderText("Confirm password");
  await user.type(pw, "password123");
  await user.type(confirm, "password123");
}

describe("AcceptStep (StaffInviteAcceptStep)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the header, password card and per-branch schedule", () => {
    renderStep();
    expect(
      screen.getByRole("heading", { name: "Accept staff invitation" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Create password")).toBeInTheDocument();
    expect(screen.getByText(/Working Schedule — Main/)).toBeInTheDocument();
  });

  it("calls onBack when the back button is clicked", async () => {
    const user = userEvent.setup();
    renderStep();
    await user.click(screen.getByRole("button", { name: "Back to preview" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("disables submit until the password is valid and matching", async () => {
    const user = userEvent.setup();
    renderStep();
    const submit = screen.getByRole("button", { name: "Accept invitation" });
    expect(submit).toBeDisabled();

    const pw = screen.getByPlaceholderText("Create password");
    await user.type(pw, "short");
    expect(screen.getByText("Password must be at least 8 characters."))
      .toBeInTheDocument();
    expect(submit).toBeDisabled();

    await user.clear(pw);
    await user.type(pw, "password123");
    await user.type(screen.getByPlaceholderText("Confirm password"), "different");
    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    expect(submit).toBeDisabled();
  });

  it("toggles password visibility for both fields", async () => {
    const user = userEvent.setup();
    renderStep();
    const pw = screen.getByPlaceholderText("Create password") as HTMLInputElement;
    const confirm = screen.getByPlaceholderText(
      "Confirm password",
    ) as HTMLInputElement;
    expect(pw.type).toBe("password");
    expect(confirm.type).toBe("password");

    // Both toggle buttons share the "Show password" label while hidden.
    const [pwToggle, confirmToggle] = screen.getAllByRole("button", {
      name: "Show password",
    });
    await user.click(pwToggle);
    expect(pw.type).toBe("text");
    await user.click(confirmToggle);
    expect(confirm.type).toBe("text");

    await user.click(screen.getAllByRole("button", { name: "Hide password" })[0]);
    expect(pw.type).toBe("password");
  });

  it("toggles a schedule day and reveals shift time inputs, then updates them", async () => {
    const user = userEvent.setup();
    renderStep();
    // No time inputs before any day is active
    expect(screen.queryAllByDisplayValue("09:00")).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "Mon" }));
    const start = screen.getByDisplayValue("09:00") as HTMLInputElement;
    const end = screen.getByDisplayValue("17:00") as HTMLInputElement;
    expect(start).toBeInTheDocument();
    expect(end).toBeInTheDocument();

    await user.clear(start);
    await user.type(start, "08:30");
    expect(screen.getByDisplayValue("08:30")).toBeInTheDocument();

    // Toggle off again hides inputs
    await user.click(screen.getByRole("button", { name: "Mon" }));
    expect(screen.queryByDisplayValue("17:00")).not.toBeInTheDocument();
  });

  it("submits with a schedule and redirects to select-profile when profiles are returned", async () => {
    const user = userEvent.setup();
    acceptStaffInviteMock.mockResolvedValue({
      data: { profiles: [{ id: "p1" }] },
    });
    renderStep();
    await user.click(screen.getByRole("button", { name: "Mon" }));
    await fillValidPassword(user);
    await user.click(screen.getByRole("button", { name: "Accept invitation" }));

    await waitFor(() =>
      expect(routerReplaceMock).toHaveBeenCalledWith("/select-profile"),
    );
    expect(acceptStaffInviteMock).toHaveBeenCalledWith(
      expect.objectContaining({
        invitation_id: "inv-1",
        token: "tok-1",
        password: "password123",
        schedule: expect.arrayContaining([
          expect.objectContaining({ branch_id: "b1" }),
        ]),
      }),
    );
    expect(setPendingProfileSelectionMock).toHaveBeenCalled();
    expect(setAvailableProfilesMock).toHaveBeenCalledWith([{ id: "p1" }]);
    expect(toastSuccessMock).toHaveBeenCalled();
  });

  it("redirects to the dashboard when authenticated and a profile/branch resolve", async () => {
    const user = userEvent.setup();
    acceptStaffInviteMock.mockResolvedValue({
      data: { authenticated: true },
    });
    apiAuthFetchMock.mockResolvedValue({ data: { id: "user-1" } });
    getActiveProfileMock.mockReturnValue({ organization: { id: "org-9" } });
    getDefaultBranchMock.mockReturnValue({ id: "branch-9" });
    getBranchIdMock.mockReturnValue("branch-9");

    renderStep();
    await fillValidPassword(user);
    await user.click(screen.getByRole("button", { name: "Accept invitation" }));

    await waitFor(() =>
      expect(routerReplaceMock).toHaveBeenCalledWith(
        "/org-9/branch-9/dashboard",
      ),
    );
    expect(setAuthenticatedMock).toHaveBeenCalled();
    // No schedule selected → omitted
    expect(acceptStaffInviteMock).toHaveBeenCalledWith(
      expect.objectContaining({ schedule: undefined }),
    );
  });

  it("falls back to root redirect when authenticated but /auth/me throws", async () => {
    const user = userEvent.setup();
    acceptStaffInviteMock.mockResolvedValue({ data: { authenticated: true } });
    apiAuthFetchMock.mockRejectedValue(new Error("boom"));

    renderStep();
    await fillValidPassword(user);
    await user.click(screen.getByRole("button", { name: "Accept invitation" }));

    await waitFor(() => expect(routerReplaceMock).toHaveBeenCalledWith("/"));
    expect(toastSuccessMock).toHaveBeenCalled();
  });

  it("falls back to root redirect when authenticated but no profile/branch", async () => {
    const user = userEvent.setup();
    acceptStaffInviteMock.mockResolvedValue({ data: { authenticated: true } });
    apiAuthFetchMock.mockResolvedValue({ data: { id: "user-1" } });
    getActiveProfileMock.mockReturnValue(undefined);
    getDefaultBranchMock.mockReturnValue(undefined);
    getBranchIdMock.mockReturnValue(undefined);

    renderStep();
    await fillValidPassword(user);
    await user.click(screen.getByRole("button", { name: "Accept invitation" }));

    await waitFor(() => expect(routerReplaceMock).toHaveBeenCalledWith("/"));
  });

  it("redirects to root when response is neither profiles nor authenticated", async () => {
    const user = userEvent.setup();
    acceptStaffInviteMock.mockResolvedValue({ data: {} });

    renderStep();
    await fillValidPassword(user);
    await user.click(screen.getByRole("button", { name: "Accept invitation" }));

    await waitFor(() => expect(routerReplaceMock).toHaveBeenCalledWith("/"));
  });

  it("shows an error toast with the mapped key when accepting fails", async () => {
    const user = userEvent.setup();
    acceptStaffInviteMock.mockRejectedValue(new ApiError(409, "conflict"));

    renderStep();
    await fillValidPassword(user);
    await user.click(screen.getByRole("button", { name: "Accept invitation" }));

    await waitFor(() =>
      expect(toastErrorMock).toHaveBeenCalledWith(
        "This invitation has already been accepted.",
      ),
    );
    expect(routerReplaceMock).not.toHaveBeenCalled();
  });

  it("renders multiple branch schedule cards", () => {
    renderStep({
      ...preview,
      branches: [
        { id: "b1", name: "Main", city: "Cairo" },
        { id: "b2", name: "Branch Two", city: "Giza" },
      ],
    });
    expect(screen.getByText(/Working Schedule — Main/)).toBeInTheDocument();
    expect(screen.getByText(/Working Schedule — Branch Two/)).toBeInTheDocument();
  });

  it("shows the accepting label while the mutation is pending", async () => {
    const user = userEvent.setup();
    let resolve: (v: unknown) => void = () => {};
    acceptStaffInviteMock.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );

    renderStep();
    await fillValidPassword(user);
    await user.click(screen.getByRole("button", { name: "Accept invitation" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Accepting..." }))
        .toBeInTheDocument(),
    );
    resolve({ data: {} });
    await waitFor(() => expect(routerReplaceMock).toHaveBeenCalled());
  });

  it("ignores within-card structure but keeps day buttons scoped per branch", async () => {
    const user = userEvent.setup();
    renderStep({
      ...preview,
      branches: [
        { id: "b1", name: "Main", city: "Cairo" },
        { id: "b2", name: "Branch Two", city: "Giza" },
      ],
    });
    const cards = screen.getAllByText(/Working Schedule/);
    expect(cards).toHaveLength(2);
    // toggling a day in the first branch card only affects that card
    const firstCard = cards[0].closest("div.rounded-2xl") as HTMLElement;
    await user.click(within(firstCard).getByRole("button", { name: "Mon" }));
    expect(within(firstCard).getByDisplayValue("09:00")).toBeInTheDocument();
  });
});
