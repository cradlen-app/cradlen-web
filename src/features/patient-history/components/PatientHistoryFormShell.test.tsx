import { screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";
import {
  TemplateExecutionContextProvider,
} from "@/builder/runtime/TemplateExecutionContext";
import type { FormTemplateDto } from "@/builder/templates/template.types";

const { buildSubmissionMock, sectionVisibility } = vi.hoisted(() => ({
  buildSubmissionMock: vi.fn((..._a: unknown[]) => ({ payload: 1 })),
  sectionVisibility: {
    isHidden: vi.fn(() => false),
    toggle: vi.fn(),
    hidden: new Set<string>(),
  },
}));

// Replace the heavy DSL renderer with a marker so we exercise the shell only.
vi.mock("@/builder/renderer/TemplateRenderer", () => ({
  TemplateRenderer: ({
    errors,
    renderGroupHeaderSlot,
  }: {
    errors?: Record<string, string>;
    renderGroupHeaderSlot?: (group: string) => React.ReactNode;
  }) => (
    <div data-testid="renderer">
      {errors ? JSON.stringify(errors) : "no-errors"}
      {renderGroupHeaderSlot ? renderGroupHeaderSlot("Background") : null}
    </div>
  ),
}));
vi.mock("../lib/history-submission", () => ({
  buildPatientHistorySubmission: (...a: unknown[]) => buildSubmissionMock(...a),
}));
vi.mock("../lib/section-visibility", () => ({
  useSectionVisibility: () => sectionVisibility,
}));
vi.mock("@/features/auth/store/authContextStore", () => ({
  useAuthContextStore: (selector: (s: { profileId: string | null }) => unknown) =>
    selector({ profileId: "profile-1" }),
}));

import { PatientHistoryFormShell } from "./PatientHistoryFormShell";

function makeTemplate(overrides: Partial<FormTemplateDto> = {}): FormTemplateDto {
  return {
    id: "tpl",
    code: "history",
    name: "History",
    description: null,
    scope: "PATIENT_HISTORY",
    version: 1,
    activated_at: null,
    specialty_id: null,
    sections: [
      {
        id: "s1",
        code: "sec1",
        name: "Section 1",
        order: 0,
        config: { ui: { group: "Background" } },
        fields: [],
      },
    ],
    ...overrides,
  } as FormTemplateDto;
}

function renderShell(
  template: FormTemplateDto,
  onSave: (b: Record<string, unknown>) => Promise<void>,
  saving = false,
) {
  return renderWithIntl(
    <TemplateExecutionContextProvider template={template}>
      <PatientHistoryFormShell
        template={template}
        patientId="p1"
        onSave={onSave}
        saving={saving}
      />
    </TemplateExecutionContextProvider>,
  );
}

describe("PatientHistoryFormShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sectionVisibility.isHidden.mockReturnValue(false);
  });

  it("renders the template renderer and a Save button", () => {
    renderShell(makeTemplate(), vi.fn().mockResolvedValue(undefined));
    expect(screen.getByTestId("renderer")).toHaveTextContent("no-errors");
    expect(screen.getByRole("button", { name: /Save/ })).toBeInTheDocument();
  });

  it("builds the submission and calls onSave when saving", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderShell(makeTemplate(), onSave);
    fireEvent.click(screen.getByRole("button", { name: /Save/ }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ payload: 1 }));
    expect(buildSubmissionMock).toHaveBeenCalled();
  });

  it("maps backend field errors into the renderer on a failed save", async () => {
    const onSave = vi.fn().mockRejectedValue({
      body: { error: { details: { fields: { lmp: ["Required"], notes: [] } } } },
    });
    renderShell(makeTemplate(), onSave);
    fireEvent.click(screen.getByRole("button", { name: /Save/ }));
    await waitFor(() =>
      expect(screen.getByTestId("renderer")).toHaveTextContent('"lmp":"Required"'),
    );
    // Empty message arrays are skipped.
    expect(screen.getByTestId("renderer")).not.toHaveTextContent("notes");
  });

  it("hides the Save button for a display-only template", () => {
    renderShell(
      makeTemplate({ is_display_only: true } as Partial<FormTemplateDto>),
      vi.fn(),
    );
    expect(screen.queryByRole("button", { name: /Save/ })).not.toBeInTheDocument();
  });

  it("toggles section visibility from the group header slot", () => {
    sectionVisibility.isHidden.mockReturnValue(true);
    renderShell(makeTemplate(), vi.fn());
    const toggle = screen.getByRole("button", { name: /Show section/i });
    fireEvent.click(toggle);
    expect(sectionVisibility.toggle).toHaveBeenCalledWith("Background");
  });
});
