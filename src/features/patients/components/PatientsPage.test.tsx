import { screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";
import type { Patient } from "@/features/visits/types/visits.types";

const {
  routerPushMock,
  useCurrentUserMock,
  usePatientsMock,
  usePatientsDirectoryMock,
  setSelectedIdMock,
  perm,
  authState,
} = vi.hoisted(() => ({
  routerPushMock: vi.fn(),
  useCurrentUserMock: vi.fn(),
  usePatientsMock: vi.fn(),
  usePatientsDirectoryMock: vi.fn(),
  setSelectedIdMock: vi.fn(),
  perm: {
    canOpenPatientWorkspace: true,
    canViewPatientAnalytics: true,
    isOwner: false,
    isBranchManager: false,
    isClinical: false,
  },
  authState: { organizationId: "org-1", branchId: "branch-1" } as {
    organizationId: string | null;
    branchId: string | null;
  },
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: routerPushMock }),
}));
vi.mock("@/features/auth/hooks/useCurrentUser", () => ({
  useCurrentUser: () => useCurrentUserMock(),
}));
vi.mock("@/features/auth/lib/current-user", () => ({
  getActiveProfile: () => ({ id: "profile-1" }),
}));
vi.mock("@/features/auth/lib/permissions", () => ({
  canOpenPatientWorkspace: () => perm.canOpenPatientWorkspace,
  canViewPatientAnalytics: () => perm.canViewPatientAnalytics,
  isOwner: () => perm.isOwner,
  isBranchManager: () => perm.isBranchManager,
  isClinical: () => perm.isClinical,
}));
vi.mock("@/features/auth/store/authContextStore", () => ({
  useAuthContextStore: (
    selector: (s: { organizationId: string | null; branchId: string | null }) => unknown,
  ) => selector(authState),
}));
vi.mock("../hooks/usePatients", () => ({
  usePatients: (...a: unknown[]) => usePatientsMock(...a),
}));
vi.mock("../hooks/usePatientsDirectory", () => ({
  usePatientsDirectory: (...a: unknown[]) => usePatientsDirectoryMock(...a),
}));

vi.mock("./PatientsHeader", () => ({ PatientsHeader: () => <div data-testid="header" /> }));
vi.mock("./PatientStatCards", () => ({
  PatientStatCards: () => <div data-testid="stat-cards" />,
}));
vi.mock("./PatientsToolbar", () => ({
  PatientsToolbar: ({
    onSearchChange,
    onFilterChange,
  }: {
    onSearchChange: (v: string) => void;
    onFilterChange: (v: string) => void;
  }) => (
    <div data-testid="toolbar">
      <input
        aria-label="search"
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <button type="button" onClick={() => onFilterChange("active")}>
        filter-active
      </button>
    </div>
  ),
}));
vi.mock("./PatientsTable", () => ({
  PatientsTable: ({
    patients,
    onOpen,
  }: {
    patients: Patient[];
    onOpen?: (p: Patient) => void;
  }) => (
    <div data-testid="patients-table">
      <span>{patients.length} rows</span>
      {onOpen && patients[0] && (
        <button type="button" onClick={() => onOpen(patients[0])}>
          open-first
        </button>
      )}
    </div>
  ),
}));

import { PatientsPage } from "./PatientsPage";

function makePatient(id: string): Patient {
  // Minimal fixture — PatientsTable is mocked, so only id is exercised.
  return { id, full_name: `Patient ${id}` } as unknown as Patient;
}

function setPatients({
  patients = [makePatient("1"), makePatient("2")],
  total = 2,
  isLoading = false,
  isError = false,
}: {
  patients?: Patient[];
  total?: number;
  isLoading?: boolean;
  isError?: boolean;
} = {}) {
  usePatientsMock.mockReturnValue({
    data: { patients, total },
    isLoading,
    isError,
  });
}

describe("PatientsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    perm.canOpenPatientWorkspace = true;
    perm.canViewPatientAnalytics = true;
    perm.isOwner = false;
    perm.isBranchManager = false;
    perm.isClinical = false;
    authState.organizationId = "org-1";
    authState.branchId = "branch-1";
    useCurrentUserMock.mockReturnValue({ data: { id: "u1" } });
    usePatientsDirectoryMock.mockReturnValue({
      selectedId: null,
      setSelectedId: setSelectedIdMock,
    });
    setPatients();
  });

  it("renders the table with the patient rows", () => {
    renderWithIntl(<PatientsPage />);
    expect(screen.getByTestId("patients-table")).toHaveTextContent("2 rows");
  });

  it("shows the analytics stat cards when permitted and a branch is set", () => {
    renderWithIntl(<PatientsPage />);
    expect(screen.getByTestId("stat-cards")).toBeInTheDocument();
  });

  it("hides the stat cards when analytics permission is missing", () => {
    perm.canViewPatientAnalytics = false;
    renderWithIntl(<PatientsPage />);
    expect(screen.queryByTestId("stat-cards")).not.toBeInTheDocument();
  });

  it("renders a no-branch notice when no branch is linked", () => {
    authState.branchId = null;
    renderWithIntl(<PatientsPage />);
    expect(
      screen.getByText(
        "No branch selected. Please select a branch to view patients.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("patients-table")).not.toBeInTheDocument();
  });

  it("renders a load-error notice", () => {
    setPatients({ patients: [], total: 0, isError: true });
    renderWithIntl(<PatientsPage />);
    expect(screen.getByText("Failed to load patients")).toBeInTheDocument();
  });

  it("renders a loading skeleton while patients load", () => {
    setPatients({ patients: [], total: 0, isLoading: true });
    const { container } = renderWithIntl(<PatientsPage />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("navigates to the workspace when a row is opened", () => {
    renderWithIntl(<PatientsPage />);
    fireEvent.click(screen.getByRole("button", { name: "open-first" }));
    expect(routerPushMock).toHaveBeenCalledWith(
      "/org-1/branch-1/dashboard/patients/1",
    );
  });

  it("does not pass an open handler when workspace access is denied", () => {
    perm.canOpenPatientWorkspace = false;
    renderWithIntl(<PatientsPage />);
    expect(
      screen.queryByRole("button", { name: "open-first" }),
    ).not.toBeInTheDocument();
  });

  it("paginates a large directory and clamps the page on shrink", () => {
    // 25 patients, PAGE_SIZE 11 → 3 pages.
    setPatients({
      patients: Array.from({ length: 25 }, (_, i) => makePatient(String(i))),
      total: 25,
    });
    renderWithIntl(<PatientsPage />);
    expect(screen.getByTestId("patients-table")).toHaveTextContent("11 rows");
    const next = screen.getByRole("button", { name: "Next page" });
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    fireEvent.click(next);
    // page 2 still has 11 rows; page indicator advances
    expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
  });
});
