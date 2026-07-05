import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";

import { renderWithIntl } from "@/test/render";
import type { FormTemplateDto } from "@/builder/templates/template.types";

const {
  mockOrgSpecialties,
  mockFormTemplate,
  mockPatient,
  mockVisitCharges,
  submit,
  mockExecState,
  push,
  toastSuccess,
  toastError,
  mockValidate,
} = vi.hoisted(() => ({
  mockOrgSpecialties: vi.fn(),
  mockFormTemplate: vi.fn(),
  mockPatient: vi.fn(),
  mockVisitCharges: vi.fn(),
  submit: vi.fn(),
  mockExecState: vi.fn(),
  push: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  mockValidate: vi.fn(),
}));

vi.mock("@/features/settings/hooks/useOrgSpecialties", () => ({
  useOrgSpecialties: (id: unknown) => mockOrgSpecialties(id),
}));
vi.mock("@/builder/templates/useFormTemplate", () => ({
  useFormTemplate: (...args: unknown[]) => mockFormTemplate(...args),
}));
vi.mock("@/features/patients/hooks/usePatient", () => ({
  usePatient: (id: unknown) => mockPatient(id),
}));
vi.mock("@/core/financial/api", () => ({
  useVisitCharges: (id: unknown) => mockVisitCharges(id),
}));
vi.mock("../hooks/useSubmitVisit", () => ({
  useSubmitVisit: () => ({ submit, isPending: false }),
}));
vi.mock("@/builder/runtime/TemplateExecutionContext", () => ({
  TemplateExecutionContextProvider: ({
    children,
  }: {
    children: React.ReactNode;
  }) => <div data-testid="exec-provider">{children}</div>,
  useTemplateExecution: () => ({ state: mockExecState() }),
}));
vi.mock("@/builder/renderer/TemplateRenderer", () => ({
  TemplateRenderer: () => <div data-testid="template-renderer" />,
}));
vi.mock("@/builder/templates/initial-values-builder", () => ({
  buildInitialValues: () => ({ formValues: {}, searchState: {}, systemValues: {} }),
}));
vi.mock("@/builder/validator/client-validator", () => ({
  validateTemplate: (...args: unknown[]) => mockValidate(...args),
}));
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push }),
}));
vi.mock("sonner", () => ({
  toast: { success: toastSuccess, error: toastError },
}));
vi.mock("../lib/mapVisitApiError", () => ({
  mapVisitApiError: () => ({ kind: "message", message: "boom" }),
}));

import { BookVisitDrawer } from "./BookVisitDrawer";

const template = {
  code: "book_visit",
  sections: [],
} as unknown as FormTemplateDto;

function baseProps() {
  return {
    open: true,
    onOpenChange: vi.fn(),
    branchId: "br-1",
    organizationId: "org-1",
  };
}

describe("BookVisitDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgSpecialties.mockReturnValue({
      data: [{ code: "OBGYN" }],
      isLoading: false,
    });
    mockFormTemplate.mockReturnValue({
      data: template,
      isLoading: false,
      isError: false,
    });
    mockPatient.mockReturnValue({ data: undefined, isLoading: false });
    mockVisitCharges.mockReturnValue({ charges: [], isLoading: false });
    mockExecState.mockReturnValue({
      formValues: {},
      searchState: {},
      systemValues: { visitor_type: "PATIENT" },
    });
    mockValidate.mockReturnValue({});
  });

  it("renders nothing visible when closed", () => {
    const props = { ...baseProps(), open: false };
    renderWithIntl(<BookVisitDrawer {...props} />);
    expect(screen.queryByText("New Visit")).toBeNull();
  });

  it("shows the loading spinner while specialties load", () => {
    mockOrgSpecialties.mockReturnValue({ data: undefined, isLoading: true });
    const { baseElement } = renderWithIntl(<BookVisitDrawer {...baseProps()} />);
    expect(baseElement.querySelector(".animate-spin")).not.toBeNull();
    expect(screen.queryByTestId("template-renderer")).toBeNull();
  });

  it("shows the no-specialty error when the org has none", () => {
    mockOrgSpecialties.mockReturnValue({ data: [], isLoading: false });
    renderWithIntl(<BookVisitDrawer {...baseProps()} />);
    // visits.create.errorNoSpecialty
    expect(
      screen.getByText(/no specialty configured/i),
    ).toBeInTheDocument();
  });

  it("shows the generic error when the template fails to load", () => {
    mockFormTemplate.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });
    renderWithIntl(<BookVisitDrawer {...baseProps()} />);
    expect(screen.getByText(/failed to book the visit/i)).toBeInTheDocument();
  });

  it("renders the booking form and submits successfully", async () => {
    submit.mockResolvedValue({ newVisitId: "v-9" });
    const props = baseProps();
    renderWithIntl(<BookVisitDrawer {...props} />);
    expect(screen.getByTestId("template-renderer")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Add to waiting list" }));

    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    expect(toastSuccess).toHaveBeenCalled();
    expect(props.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("blocks submit and surfaces client validation errors", async () => {
    mockValidate.mockReturnValue({ patient_id: "Required" });
    renderWithIntl(<BookVisitDrawer {...baseProps()} />);
    fireEvent.click(screen.getByRole("button", { name: "Add to waiting list" }));
    await waitFor(() => expect(mockValidate).toHaveBeenCalled());
    expect(submit).not.toHaveBeenCalled();
  });

  it("does not navigate after booking a medical-rep visit (stays on the list)", async () => {
    // The rep visit workspace is doctor-only; reception books and stays on the
    // list, so the drawer must not auto-open the workspace after booking.
    mockExecState.mockReturnValue({
      formValues: {},
      searchState: {},
      systemValues: { visitor_type: "MEDICAL_REP" },
    });
    submit.mockResolvedValue({ newVisitId: "v-rep" });
    const props = baseProps();
    renderWithIntl(<BookVisitDrawer {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Add to waiting list" }));
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    expect(toastSuccess).toHaveBeenCalled();
    expect(props.onOpenChange).toHaveBeenCalledWith(false);
    expect(push).not.toHaveBeenCalled();
  });
});
