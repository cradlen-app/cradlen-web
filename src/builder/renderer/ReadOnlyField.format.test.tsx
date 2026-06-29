import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TemplateExecutionContextProvider } from "../runtime/TemplateExecutionContext";
import { ReadOnlyField } from "./ReadOnlyField";
import type { FormFieldDto, FormTemplateDto } from "../templates/template.types";

const OPTIONS = [
  { code: "A", label: "Apple" },
  { code: "B", label: "Banana" },
];

function makeField(partial: Partial<FormFieldDto>): FormFieldDto {
  return {
    id: "f",
    code: "f",
    label: "Field",
    type: "TEXT",
    order: 0,
    required: false,
    binding: { namespace: "PATIENT", path: "f" },
    config: {},
    ...partial,
  } as FormFieldDto;
}

function renderField(field: FormFieldDto, value?: unknown) {
  const template = {
    id: "t",
    code: "c",
    name: "n",
    description: null,
    scope: "PATIENT_HISTORY",
    version: 1,
    activated_at: null,
    specialty_id: null,
    sections: [{ id: "s", code: "s", name: "s", order: 0, config: {}, fields: [field] }],
  } as FormTemplateDto;
  return render(
    <TemplateExecutionContextProvider
      template={template}
      initialFormValues={value === undefined ? {} : { [field.code]: value }}
    >
      <ReadOnlyField field={field} />
    </TemplateExecutionContextProvider>,
  );
}

describe("ReadOnlyField formatValue", () => {
  it("renders an em-dash for undefined, null and empty-string values", () => {
    renderField(makeField({ code: "a" }));
    expect(screen.getByText("—")).toBeInTheDocument();

    renderField(makeField({ code: "b" }), null);
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);

    renderField(makeField({ code: "c" }), "");
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("renders raw strings/numbers for plain TEXT/NUMBER fields", () => {
    renderField(makeField({ code: "t", type: "TEXT" }), "Hello");
    expect(screen.getByText("Hello")).toBeInTheDocument();

    renderField(makeField({ code: "n", type: "NUMBER" }), 42);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders BOOLEAN as Yes / No", () => {
    renderField(makeField({ code: "yes", type: "BOOLEAN" }), true);
    expect(screen.getByText("Yes")).toBeInTheDocument();

    renderField(makeField({ code: "no", type: "BOOLEAN" }), false);
    expect(screen.getByText("No")).toBeInTheDocument();
  });

  it("maps a SELECT value to its option label, falling back to the raw code", () => {
    const field = makeField({
      code: "sel",
      type: "SELECT",
      config: { validation: { options: OPTIONS } },
    });
    renderField(field, "A");
    expect(screen.getByText("Apple")).toBeInTheDocument();

    renderField(makeField({ ...field, code: "sel2" }), "UNKNOWN");
    expect(screen.getByText("UNKNOWN")).toBeInTheDocument();
  });

  it("joins MULTISELECT array values as comma-separated labels", () => {
    const field = makeField({
      code: "ms",
      type: "MULTISELECT",
      config: { validation: { options: OPTIONS } },
    });
    renderField(field, ["A", "B"]);
    expect(screen.getByText("Apple, Banana")).toBeInTheDocument();
  });

  it("renders an em-dash for an empty MULTISELECT array", () => {
    const field = makeField({
      code: "msEmpty",
      type: "MULTISELECT",
      config: { validation: { options: OPTIONS } },
    });
    renderField(field, []);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("maps a non-array MULTISELECT value through optionLabel", () => {
    const field = makeField({
      code: "msScalar",
      type: "MULTISELECT",
      config: { validation: { options: OPTIONS } },
    });
    renderField(field, "B");
    expect(screen.getByText("Banana")).toBeInTheDocument();
  });
});
