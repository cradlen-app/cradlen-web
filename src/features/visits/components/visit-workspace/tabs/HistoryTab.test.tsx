import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/render";
import { ApiError } from "@/infrastructure/http/api";

const { mockTemplateQuery, mockDataQuery, mockResolve, mockToInitial } =
  vi.hoisted(() => ({
    mockTemplateQuery: vi.fn(),
    mockDataQuery: vi.fn(),
    mockResolve: vi.fn(),
    mockToInitial: vi.fn(),
  }));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useQuery: () => mockTemplateQuery(),
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  };
});
vi.mock("@/builder/templates/templates.api", () => ({
  fetchFormTemplate: vi.fn(),
}));
vi.mock("@/builder/runtime/TemplateExecutionContext", () => ({
  TemplateExecutionContextProvider: ({
    children,
  }: {
    children: React.ReactNode;
  }) => <div data-testid="exec-provider">{children}</div>,
}));
vi.mock("@/features/patient-history/lib/specialty-resolver", () => ({
  resolveSpecialtyHistory: (...a: unknown[]) => mockResolve(...a),
}));
vi.mock("@/features/patient-history/api/usePatientHistory", () => ({
  usePatientHistory: () => mockDataQuery(),
  usePatchPatientHistory: () => ({ isPending: false, mutateAsync: vi.fn() }),
  patientHistoryKey: (p: string) => ["patient-history", p],
}));
vi.mock("@/features/patient-history/lib/history-initial-values", () => ({
  toInitialHistoryState: () => mockToInitial(),
}));
vi.mock("@/features/patient-history/components/PatientHistoryEmptyState", () => ({
  PatientHistoryEmptyState: ({ reason }: { reason: string }) => (
    <div data-testid="empty-state" data-reason={reason} />
  ),
}));
vi.mock("@/features/patient-history/components/PatientHistoryFormShell", () => ({
  PatientHistoryFormShell: () => <div data-testid="history-form-shell" />,
}));

import { HistoryTab } from "./HistoryTab";

const config = {
  templateCode: "obgyn_history",
  endpointPath: "/patients/p-1/history/obgyn",
};

describe("HistoryTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolve.mockReturnValue(config);
    mockTemplateQuery.mockReturnValue({ data: undefined, isLoading: false, error: null });
    mockDataQuery.mockReturnValue({ data: undefined, isLoading: false, error: null, isFetching: false });
    mockToInitial.mockReturnValue({
      formValues: {},
      searchState: {},
      repeatableRows: {},
    });
  });

  it("renders the no-specialty empty state when patientId is missing", () => {
    renderWithIntl(<HistoryTab patientId={null} specialtyCode="OBGYN" />);
    expect(screen.getByTestId("empty-state").dataset.reason).toBe("no_specialty");
  });

  it("renders the no-specialty empty state when no config resolves", () => {
    mockResolve.mockReturnValue(null);
    renderWithIntl(<HistoryTab patientId="p-1" specialtyCode={null} />);
    expect(screen.getByTestId("empty-state").dataset.reason).toBe("no_specialty");
  });

  it("renders the no-template empty state on a 404 template error", () => {
    mockTemplateQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new ApiError(404, "Not found"),
    });
    renderWithIntl(<HistoryTab patientId="p-1" specialtyCode="OBGYN" />);
    expect(screen.getByTestId("empty-state").dataset.reason).toBe("no_template");
  });

  it("renders the loading indicator while queries resolve", () => {
    mockTemplateQuery.mockReturnValue({ data: undefined, isLoading: true, error: null });
    renderWithIntl(<HistoryTab patientId="p-1" specialtyCode="OBGYN" />);
    expect(screen.getByText("Loading history…")).toBeInTheDocument();
  });

  it("renders the load error when data is missing after loading", () => {
    mockTemplateQuery.mockReturnValue({ data: { sections: [] }, isLoading: false, error: null });
    mockDataQuery.mockReturnValue({ data: undefined, isLoading: false, error: null, isFetching: false });
    renderWithIntl(<HistoryTab patientId="p-1" specialtyCode="OBGYN" />);
    expect(screen.getByText("Could not load history.")).toBeInTheDocument();
  });

  it("renders the form shell when template and data are available", () => {
    mockTemplateQuery.mockReturnValue({ data: { sections: [] }, isLoading: false, error: null });
    mockDataQuery.mockReturnValue({
      data: { version: 3 },
      isLoading: false,
      error: null,
      isFetching: false,
    });
    renderWithIntl(<HistoryTab patientId="p-1" specialtyCode="OBGYN" />);
    expect(screen.getByTestId("history-form-shell")).toBeInTheDocument();
  });
});
