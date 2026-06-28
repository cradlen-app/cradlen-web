import { screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";

const { useCurrentUserMock, usePatientMock, perm, authState } = vi.hoisted(() => ({
  useCurrentUserMock: vi.fn(),
  usePatientMock: vi.fn(),
  perm: { canOpenPatientWorkspace: true, canManagePatient: true },
  authState: { organizationId: "org-1", branchId: "branch-1" } as {
    organizationId: string | null;
    branchId: string | null;
  },
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, ...props }: { children: React.ReactNode }) => (
    <a {...props}>{children}</a>
  ),
}));
vi.mock("@/features/auth/hooks/useCurrentUser", () => ({
  useCurrentUser: () => useCurrentUserMock(),
}));
vi.mock("@/features/auth/lib/current-user", () => ({
  getActiveProfile: () => ({ id: "profile-1" }),
  getOrganizationSpecialtyCodes: () => ["OBGYN"],
}));
vi.mock("@/features/auth/lib/permissions", () => ({
  canManagePatient: () => perm.canManagePatient,
  canOpenPatientWorkspace: () => perm.canOpenPatientWorkspace,
}));
vi.mock("@/features/auth/store/authContextStore", () => ({
  useAuthContextStore: (
    selector: (s: { organizationId: string | null; branchId: string | null }) => unknown,
  ) => selector(authState),
}));
vi.mock("@/features/patients/hooks/usePatient", () => ({
  usePatient: (...a: unknown[]) => usePatientMock(...a),
}));

vi.mock(
  "@/features/visits/components/visit-workspace/overview/PatientOverview",
  () => ({ PatientOverview: () => <div data-testid="overview" /> }),
);
vi.mock("@/features/visits/components/visit-workspace/tabs/HistoryTab", () => ({
  HistoryTab: () => <div data-testid="history" />,
}));
vi.mock("./PatientProfileDrawer", () => ({
  PatientProfileDrawer: ({ open }: { open: boolean }) => (
    <div data-testid="profile-drawer">{open ? "open" : "closed"}</div>
  ),
}));

import { PatientWorkspacePage } from "./PatientWorkspacePage";

function setPatient({
  isLoading = false,
  isError = false,
  fullName = "Mona Amin",
}: { isLoading?: boolean; isError?: boolean; fullName?: string } = {}) {
  usePatientMock.mockReturnValue({
    data: isError
      ? undefined
      : { data: { full_name: fullName, date_of_birth: "1990-01-01" } },
    isLoading,
    isError,
  });
}

describe("PatientWorkspacePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    perm.canOpenPatientWorkspace = true;
    perm.canManagePatient = true;
    authState.organizationId = "org-1";
    authState.branchId = "branch-1";
    useCurrentUserMock.mockReturnValue({ data: { id: "u1" }, isLoading: false });
    setPatient();
  });

  it("renders the breadcrumb with the patient name and the overview tab by default", () => {
    renderWithIntl(<PatientWorkspacePage patientId="p1" />);
    expect(screen.getByText("Mona Amin")).toBeInTheDocument();
    expect(screen.getByTestId("overview")).toBeInTheDocument();
  });

  it("renders a loading shell while the current user resolves", () => {
    useCurrentUserMock.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = renderWithIntl(<PatientWorkspacePage patientId="p1" />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("blocks access when the user cannot open the workspace", () => {
    perm.canOpenPatientWorkspace = false;
    renderWithIntl(<PatientWorkspacePage patientId="p1" />);
    expect(
      screen.getByText("You don't have permission to view patient details."),
    ).toBeInTheDocument();
  });

  it("shows a load-error message", () => {
    setPatient({ isError: true });
    renderWithIntl(<PatientWorkspacePage patientId="p1" />);
    expect(screen.getByText("Failed to load patient")).toBeInTheDocument();
  });

  it("switches to the history tab when its trigger is clicked", () => {
    renderWithIntl(<PatientWorkspacePage patientId="p1" />);
    fireEvent.click(screen.getByRole("tab", { name: "History" }));
    expect(screen.getByTestId("history")).toBeInTheDocument();
  });

  it("opens the profile drawer via the edit button when the user can manage", () => {
    renderWithIntl(<PatientWorkspacePage patientId="p1" />);
    expect(screen.getByTestId("profile-drawer")).toHaveTextContent("closed");
    fireEvent.click(screen.getByRole("button", { name: /Edit profile/i }));
    expect(screen.getByTestId("profile-drawer")).toHaveTextContent("open");
  });

  it("hides the edit button when the user cannot manage patients", () => {
    perm.canManagePatient = false;
    renderWithIntl(<PatientWorkspacePage patientId="p1" />);
    expect(
      screen.queryByRole("button", { name: /Edit profile/i }),
    ).not.toBeInTheDocument();
  });
});
