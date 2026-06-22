import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TemplateExecutionContextProvider } from "../runtime/TemplateExecutionContext";
import { ReadOnlyField } from "./ReadOnlyField";
import type { FormFieldDto, FormTemplateDto } from "../templates/template.types";

const mirrorField = {
  id: "f-sr",
  code: "summary_risk",
  label: "Risk level",
  type: "SELECT",
  order: 0,
  required: false,
  config: {
    ui: { mirrorOf: "risk_level" },
    validation: {
      options: [
        { code: "HIGH", label: "High" },
        { code: "NORMAL", label: "Normal" },
      ],
    },
  },
} as unknown as FormFieldDto;

const template = {
  id: "t",
  code: "obgyn_pregnancy",
  name: "P",
  version: 3,
  scope: "JOURNEY_CLINICAL",
  sections: [
    { id: "s", code: "summary", name: "Summary", order: 0, config: {}, fields: [mirrorField] },
  ],
} as unknown as FormTemplateDto;

describe("ReadOnlyField mirrorOf", () => {
  it("reflects the mirrored editable field's live value, mapped to its label", () => {
    render(
      <TemplateExecutionContextProvider
        template={template}
        initialFormValues={{ risk_level: "HIGH" }}
      >
        <ReadOnlyField field={mirrorField} />
      </TemplateExecutionContextProvider>,
    );
    // Reads risk_level (HIGH) live and maps via the field's options → "High".
    expect(screen.getByText("High")).toBeInTheDocument();
  });
});
