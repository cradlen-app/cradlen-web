import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/render";
import { ApiError } from "@/infrastructure/http/api";
import type { Visit } from "@/features/visits/types/visits.types";

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
vi.mock("@/builder/templates/initial-values", () => ({
  toInitialFormState: () => mockToInitial(),
}));
vi.mock("@/features/examination/lib/specialty-resolver", () => ({
  resolveSpecialtyExamination: (...a: unknown[]) => mockResolve(...a),
}));
vi.mock("@/features/examination/api/useVisitExamination", () => ({
  useVisitExamination: () => mockDataQuery(),
  usePatchVisitExamination: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));
vi.mock("@/features/examination/components/VisitExaminationFormShell", () => ({
  VisitExaminationFormShell: ({ footerSlot }: { footerSlot?: React.ReactNode }) => (
    <div data-testid="exam-form-shell">{footerSlot}</div>
  ),
}));
vi.mock("@/features/examination/components/InvestigationsResultPanel", () => ({
  InvestigationsResultPanel: () => <div data-testid="investigations-panel" />,
}));
vi.mock("@/features/examination/lib/history-binding", () => ({
  OBGYN_EXAM_CONTAINERS: new Set<string>(),
}));
vi.mock("@/features/examination/lib/pregnancy-activation-context", () => ({
  PregnancyActivationContext: { Provider: ({ children }: { children: React.ReactNode }) => <>{children}</> },
}));

import { ExaminationTab } from "./ExaminationTab";

const visit = {
  id: "v-1",
  specialtyCode: "OBGYN",
  carePathCode: "OBGYN_PREGNANCY",
  patient: { id: "p-1", fullName: "Sara" },
} as unknown as Visit;

const config = { templateCode: "obgyn_exam", endpointPath: "/visits/v-1/exam" };

describe("ExaminationTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolve.mockReturnValue(config);
    mockTemplateQuery.mockReturnValue({ data: undefined, isLoading: false, error: null });
    mockDataQuery.mockReturnValue({ data: undefined, isLoading: false, error: null });
    mockToInitial.mockReturnValue({
      formValues: {},
      searchState: {},
      repeatableRows: {},
    });
  });

  it("renders the load error when no config resolves", () => {
    mockResolve.mockReturnValue(null);
    renderWithIntl(<ExaminationTab visit={visit} />);
    expect(screen.getByText("Could not load examination.")).toBeInTheDocument();
  });

  it("renders the unsupported-specialty message on a 404 template error", () => {
    mockTemplateQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new ApiError(404, "Not found"),
    });
    renderWithIntl(<ExaminationTab visit={visit} />);
    // examination.workspace.unsupportedSpecialty
    expect(
      screen.getByText(/doesn't support documenting/i),
    ).toBeInTheDocument();
  });

  it("renders the loading indicator while queries resolve", () => {
    mockTemplateQuery.mockReturnValue({ data: undefined, isLoading: true, error: null });
    renderWithIntl(<ExaminationTab visit={visit} />);
    expect(screen.getByText("Loading examination…")).toBeInTheDocument();
  });

  it("renders the form shell when template and data are available", () => {
    mockTemplateQuery.mockReturnValue({ data: { sections: [] }, isLoading: false, error: null });
    mockDataQuery.mockReturnValue({
      data: { examination_version: 2, case_path: null, investigations: [] },
      isLoading: false,
      error: null,
    });
    renderWithIntl(<ExaminationTab visit={visit} />);
    expect(screen.getByTestId("exam-form-shell")).toBeInTheDocument();
  });

  it("renders the investigations panel in read-only mode", () => {
    mockTemplateQuery.mockReturnValue({ data: { sections: [] }, isLoading: false, error: null });
    mockDataQuery.mockReturnValue({
      data: { examination_version: 2, case_path: "X", investigations: [] },
      isLoading: false,
      error: null,
    });
    renderWithIntl(<ExaminationTab visit={visit} readOnly />);
    expect(screen.getByTestId("exam-form-shell")).toBeInTheDocument();
    expect(screen.getByTestId("investigations-panel")).toBeInTheDocument();
  });
});
