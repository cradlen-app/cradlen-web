import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";

import { renderWithIntl } from "@/test/render";

const {
  mockVisit,
  mockJourney,
  mockInvoice,
  mockUpdateStatus,
  canDrive,
  canBilling,
  captureCharge,
} = vi.hoisted(() => ({
  mockVisit: vi.fn(),
  mockJourney: vi.fn(),
  mockInvoice: vi.fn(),
  mockUpdateStatus: vi.fn(),
  canDrive: vi.fn(),
  canBilling: vi.fn(),
  captureCharge: vi.fn(),
}));

vi.mock("@/features/auth/hooks/useCurrentUser", () => ({
  useCurrentUser: () => ({ data: { id: "u-1" } }),
}));
vi.mock("@/features/auth/lib/current-user", () => ({
  getActiveProfile: () => ({ id: "prof-1" }),
}));
vi.mock("@/features/auth/lib/permissions", () => ({
  canAccessBilling: () => canBilling(),
  canDriveClinicalVisit: () => canDrive(),
}));
vi.mock("@/features/auth/store/authContextStore", () => ({
  useAuthContextStore: (selector: (s: Record<string, string>) => unknown) =>
    selector({ branchId: "br-1", organizationId: "org-1", profileId: "prof-1" }),
}));
vi.mock("../../hooks/useUpdateVisitStatus", () => ({
  useUpdateVisitStatus: () => mockUpdateStatus(),
}));
vi.mock("../../hooks/useVisit", () => ({
  useVisit: (id: string) => mockVisit(id),
}));
vi.mock("@/core/financial/pages", () => ({
  InvoiceDrawer: ({ open }: { open: boolean }) => (
    <div data-testid="invoice-drawer" data-open={String(open)} />
  ),
  AddChargeDrawer: ({ open }: { open: boolean }) => (
    <div data-testid="add-charge-drawer" data-open={String(open)} />
  ),
}));
vi.mock("@/core/financial/api", () => ({
  financialCan: { captureCharge: () => captureCharge() },
  useVisitInvoice: (id?: string) => mockInvoice(id),
}));
vi.mock("../CompleteVisitDialog", () => ({
  CompleteVisitDialog: () => <div data-testid="complete-dialog" />,
}));
vi.mock("../PrescriptionPrintModal", () => ({
  PrescriptionPrintModal: () => <div data-testid="prescription-modal" />,
}));
vi.mock("./VisitWorkspaceHeader", () => ({
  VisitWorkspaceHeader: () => <div data-testid="header" />,
}));
vi.mock("./tabs/OverviewTab", () => ({
  OverviewTab: () => <div data-testid="overview-tab" />,
}));
vi.mock("./tabs/HistoryTab", () => ({
  HistoryTab: () => <div data-testid="history-tab" />,
}));
vi.mock("./tabs/ExaminationTab", () => ({
  ExaminationTab: () => <div data-testid="examination-tab" />,
}));
vi.mock("@/features/journeys/lib/useVisitJourney", () => ({
  useVisitJourney: (id: string) => mockJourney(id),
}));
vi.mock("@/features/journeys/components/JourneyClinicalTab", () => ({
  JourneyClinicalTab: () => <div data-testid="journey-tab" />,
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

import { VisitWorkspacePage } from "./VisitWorkspacePage";

const visit = {
  id: "v-1",
  status: "IN_CONSULTATION",
  assignedDoctorId: "prof-1",
  patient: { id: "p-1", fullName: "Sara Mahmoud" },
  specialtyCode: "OBGYN",
};

describe("VisitWorkspacePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVisit.mockReturnValue({ data: visit, isLoading: false, isError: false });
    mockJourney.mockReturnValue({ data: null });
    mockInvoice.mockReturnValue({ invoice: undefined });
    mockUpdateStatus.mockReturnValue({ isPending: false });
    canDrive.mockReturnValue(true);
    canBilling.mockReturnValue(true);
    captureCharge.mockReturnValue(false);
  });

  it("renders the loading skeleton while the visit loads", () => {
    mockVisit.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    const { container } = renderWithIntl(<VisitWorkspacePage visitId="v-1" />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    expect(screen.queryByTestId("header")).toBeNull();
  });

  it("renders the error state when the visit fails to load", () => {
    mockVisit.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    renderWithIntl(<VisitWorkspacePage visitId="v-1" />);
    expect(screen.getByText("Could not load this visit.")).toBeInTheDocument();
  });

  it("renders the header and the three base tabs", () => {
    renderWithIntl(<VisitWorkspacePage visitId="v-1" />);
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Overview" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "History" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Examination" })).toBeInTheDocument();
    // Overview is the default tab.
    expect(screen.getByTestId("overview-tab")).toBeInTheDocument();
  });

  it("switches to the history tab on click", () => {
    renderWithIntl(<VisitWorkspacePage visitId="v-1" />);
    fireEvent.click(screen.getByRole("tab", { name: "History" }));
    expect(screen.getByTestId("history-tab")).toBeInTheDocument();
  });

  it("renders the dynamic journey tab when the journey declares a clinical surface", () => {
    mockJourney.mockReturnValue({
      data: {
        journey_id: "j-1",
        clinical_surface: { label: "Pregnancy" },
      },
    });
    renderWithIntl(<VisitWorkspacePage visitId="v-1" />);
    expect(screen.getByRole("tab", { name: "Pregnancy" })).toBeInTheDocument();
  });
});
