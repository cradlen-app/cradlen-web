import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithIntl } from "@/test/render";
import type { FormSectionDto, FormTemplateDto } from "@/builder/templates/template.types";

const useTemplateExecution = vi.fn();
const useEvaluationContext = vi.fn();
const buildTemplateSubmission = vi.fn();
const useCarePaths = vi.fn();

// Render section header slots so the eye toggle buttons are exercised.
vi.mock("@/builder/renderer/TemplateRenderer", () => ({
  TemplateRenderer: ({
    template,
    renderSectionHeaderSlot,
  }: {
    template: FormTemplateDto;
    renderSectionHeaderSlot: (s: FormSectionDto) => React.ReactNode;
  }) => (
    <div data-testid="template-renderer">
      {template.sections.map((s) => (
        <div key={s.code}>{renderSectionHeaderSlot(s)}</div>
      ))}
    </div>
  ),
}));

vi.mock("@/builder/runtime/TemplateExecutionContext", () => ({
  useTemplateExecution: () => useTemplateExecution(),
  useEvaluationContext: () => useEvaluationContext(),
}));

vi.mock("@/builder/templates/build-submission", () => ({
  buildTemplateSubmission: (...args: unknown[]) => buildTemplateSubmission(...args),
}));

vi.mock("@/features/care-paths/lib/useCarePaths", () => ({
  useCarePaths: (...args: unknown[]) => useCarePaths(...args),
}));

import { VisitExaminationFormShell } from "./VisitExaminationFormShell";

function section(code: string, group?: string): FormSectionDto {
  return {
    code,
    config: group ? { ui: { group } } : {},
  } as unknown as FormSectionDto;
}

function makeTemplate(): FormTemplateDto {
  return {
    sections: [
      section("main_complaint"),
      section("exam_abdomen", "Examination"),
      section("history_obstetric"),
    ],
  } as unknown as FormTemplateDto;
}

beforeEach(() => {
  vi.clearAllMocks();
  useTemplateExecution.mockReturnValue({ state: { foo: "bar" } });
  useEvaluationContext.mockReturnValue({ case_path: "OBGYN_GENERAL" });
  buildTemplateSubmission.mockReturnValue({ submitted: true });
  useCarePaths.mockReturnValue({ data: [] });
});

describe("VisitExaminationFormShell", () => {
  it("renders the Save button and the template renderer", () => {
    renderWithIntl(
      <VisitExaminationFormShell
        template={makeTemplate()}
        patientId="p1"
        onSave={vi.fn()}
        saving={false}
      />,
    );
    expect(screen.getByTestId("template-renderer")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("builds the submission and calls onSave when saving", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderWithIntl(
      <VisitExaminationFormShell
        template={makeTemplate()}
        patientId="p1"
        onSave={onSave}
        saving={false}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ submitted: true }));
    expect(buildTemplateSubmission).toHaveBeenCalled();
  });

  it("hides the Save button in read-only mode", () => {
    renderWithIntl(
      <VisitExaminationFormShell
        template={makeTemplate()}
        patientId="p1"
        onSave={vi.fn()}
        saving={false}
        readOnly
      />,
    );
    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
  });

  it("renders eye-toggle buttons only for toggleable sections", () => {
    renderWithIntl(
      <VisitExaminationFormShell
        template={makeTemplate()}
        patientId="p1"
        onSave={vi.fn()}
        saving={false}
      />,
    );
    // exam_abdomen (Examination group) + history_obstetric (history_ prefix) = 2 toggles.
    // main_complaint is not toggleable.
    const toggles = screen.getAllByRole("button", { name: /section/i });
    expect(toggles).toHaveLength(2);
  });

  it("toggles a section's collapsed state when its eye button is clicked", () => {
    renderWithIntl(
      <VisitExaminationFormShell
        template={makeTemplate()}
        patientId="p1"
        onSave={vi.fn()}
        saving={false}
      />,
    );
    // Toggleable sections start collapsed → label is "Show section group".
    const showButtons = screen.getAllByRole("button", { name: "Show section group" });
    expect(showButtons.length).toBeGreaterThan(0);
    fireEvent.click(showButtons[0]);
    // After expanding, at least one becomes "Hide section group".
    expect(
      screen.getAllByRole("button", { name: "Hide section group" }).length,
    ).toBeGreaterThan(0);
  });

  it("disables the Save button while saving", () => {
    renderWithIntl(
      <VisitExaminationFormShell
        template={makeTemplate()}
        patientId="p1"
        onSave={vi.fn()}
        saving
      />,
    );
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });
});
