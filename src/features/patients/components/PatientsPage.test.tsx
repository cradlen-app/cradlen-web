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
    canRegisterPatient: false,
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
  canRegisterPatient: () => perm.canRegisterPatient,
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

vi.mock("./PatientsHeader", () => ({
  PatientsHeader: ({
    canRegister,
    onRegister,
  }: {
    canRegister?: boolean;
    onRegister?: () => void;
  }) => (
    <div data-testid="header">
      {canRegister && (
        <button type="button" onClick={onRegister}>
          add-patient
        </button>
      )}
    </div>
  ),
}));
vi.mock("./RegisterPatientDrawer", () => ({
  RegisterPatientDrawer: ({ open }: { open: boolean }) =>
    open ? <div data-testid="register-drawer" /> : null,
}));
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
  totalPages = 1,
  isLoading = false,
  isError = false,
}: {
  patients?: Patient[];
  total?: number;
  totalPages?: number;
  isLoading?: boolean;
  isError?: boolean;
} = {}) {
  usePatientsMock.mockReturnValue({
    data: { patients, total, totalPages },
    isLoading,
    isError,
  });
}

describe("PatientsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    perm.canOpenPatientWorkspace = true;
    perm.canViewPatientAnalytics = true;
    perm.canRegisterPatient = false;
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

  it("pages through the directory server-side", () => {
    // Fake server: 25 patients at 11 per page → 3 pages. The hook is keyed on
    // the requested page, so the component must render whatever comes back
    // rather than slicing a full set client-side.
    const PAGE_SIZE = 11;
    const all = Array.from({ length: 25 }, (_, i) => makePatient(String(i)));
    usePatientsMock.mockImplementation(
      (_branchId: unknown, params: { page?: number } = {}) => {
        const page = params.page ?? 1;
        return {
          data: {
            patients: all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
            total: all.length,
            totalPages: 3,
          },
          isLoading: false,
          isError: false,
        };
      },
    );

    renderWithIntl(<PatientsPage />);
    expect(screen.getByTestId("patients-table")).toHaveTextContent("11 rows");
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();

    const next = screen.getByRole("button", { name: "Next page" });
    fireEvent.click(next);
    expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
    // The page travelled to the server rather than being sliced locally.
    expect(usePatientsMock).toHaveBeenLastCalledWith(
      "branch-1",
      expect.objectContaining({ page: 2 }),
    );

    // Last page is short — 25 = 11 + 11 + 3.
    fireEvent.click(next);
    expect(screen.getByText("Page 3 of 3")).toBeInTheDocument();
    expect(screen.getByTestId("patients-table")).toHaveTextContent("3 rows");
    expect(next).toBeDisabled();
  });

  it("hides the pagination control when everything fits on one page", () => {
    setPatients({ total: 2, totalPages: 1 });
    renderWithIntl(<PatientsPage />);
    expect(
      screen.queryByRole("button", { name: "Next page" }),
    ).not.toBeInTheDocument();
  });

  describe("patient registration", () => {
    it("hides the register action when the caller may not register", () => {
      perm.canRegisterPatient = false;
      renderWithIntl(<PatientsPage />);
      expect(
        screen.queryByRole("button", { name: "add-patient" }),
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId("register-drawer")).not.toBeInTheDocument();
    });

    it("opens the drawer from the header action", () => {
      perm.canRegisterPatient = true;
      renderWithIntl(<PatientsPage />);

      // Closed until asked for — the drawer must not mount on page load.
      expect(screen.queryByTestId("register-drawer")).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "add-patient" }));
      expect(screen.getByTestId("register-drawer")).toBeInTheDocument();
    });
  });
});
