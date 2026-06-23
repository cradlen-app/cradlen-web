import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TemplateExecutionContextProvider } from "../runtime/TemplateExecutionContext";
import { FieldRenderer } from "./FieldRenderer";
import type { FormFieldDto, FormTemplateDto } from "../templates/template.types";

const computedField = {
  id: "f-ga",
  code: "ga_lmp",
  label: "GA (LMP)",
  type: "COMPUTED",
  order: 0,
  required: false,
  binding: { namespace: "COMPUTED", path: "ga_lmp" },
  config: { ui: { derivedFrom: ["lmp"] }, logic: { formula: "ga_from_lmp" } },
} as unknown as FormFieldDto;

const template = {
  id: "t",
  code: "obgyn_pregnancy",
  name: "P",
  version: 3,
  scope: "JOURNEY_CLINICAL",
  sections: [
    { id: "s", code: "x", name: "X", order: 0, config: {}, fields: [computedField] },
  ],
} as unknown as FormTemplateDto;

function renderField(props: { displayOnly: boolean; hardReadOnly: boolean }) {
  return render(
    <TemplateExecutionContextProvider
      template={template}
      initialFormValues={{ ga_lmp: "24w 0d" }}
    >
      <FieldRenderer field={computedField} {...props} />
    </TemplateExecutionContextProvider>,
  );
}

describe("FieldRenderer hard vs section read-only (COMPUTED)", () => {
  it("renders COMPUTED as static text (no input) under a hard read-only snapshot", () => {
    renderField({ displayOnly: true, hardReadOnly: true });
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByText("24w 0d")).toBeInTheDocument();
  });

  it("keeps COMPUTED live (renders ComputedInput) under section-only read-only", () => {
    renderField({ displayOnly: true, hardReadOnly: false });
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });
});
